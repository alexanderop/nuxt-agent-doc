import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http'
import { randomBytes } from 'node:crypto'
import { AsyncLocalStorage } from 'node:async_hooks'
import {
  NodeRuntime,
  createNodeDriver,
  createNodeRuntimeDriverFactory,
  type NetworkAdapter
} from 'secure-exec'

const ERROR_PREFIX = '__ERROR__'
const RETURN_TOOL = '__return__'
const DEFAULT_MAX_RESULT_SIZE = 102_400
const DEFAULT_MAX_REQUEST_BODY_BYTES = 1_048_576
const DEFAULT_MAX_TOOL_RESPONSE_SIZE = 1_048_576
const DEFAULT_WALL_TIME_LIMIT_MS = 60_000
const DEFAULT_MAX_TOOL_CALLS = 200
const MAX_LOG_ENTRIES = 200

export type ToolFn = (input: unknown) => Promise<unknown> | unknown
export type CodeFns = Record<string, ToolFn>

export type ExecOptions = {
  wallTimeLimitMs?: number
  maxToolCalls?: number
  maxResultSize?: number
  maxToolResponseSize?: number
  maxRequestBodyBytes?: number
}

export type ExecResult = {
  result?: unknown
  error?: string
  logs: string[]
}

type Execution = {
  fns: CodeFns
  onReturn: (value: unknown) => void
  returned: boolean
  restoreContext: <Args extends unknown[], R>(fn: (...args: Args) => R, ...args: Args) => R
  deadlineMs: number
  rpcCallCount: number
  maxToolCalls: number
  maxToolResponseSize: number
}

type RpcState = {
  server: Server
  port: number
  token: string
  executions: Map<string, Execution>
  maxRequestBodyBytes: number
}

let rpcState: RpcState | null = null
let rpcStatePromise: Promise<RpcState> | null = null
let runtimeInstance: NodeRuntime | null = null
const SAFE_IDENTIFIER = /^[\w$]+$/

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseRpcBody(body: string): { tool: string, args: unknown, execId: string } | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return null
  }
  if (!isPlainRecord(parsed)) return null
  const { tool, args, execId } = parsed
  if (typeof tool !== 'string' || typeof execId !== 'string' || execId.length === 0) return null
  return { tool, args, execId }
}

function sanitizeErrorMessage(msg: string): string {
  return msg
    .replace(/(?:\/[\w.][-\w.]*)+\.\w+/g, '[path]')
    .replace(/(?:[A-Z]:\\[\w.][-\w.\\]*)+/g, '[path]')
    .replace(/\n\s+at .+/g, '')
    .slice(0, 500)
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  let serialized: string
  try {
    serialized = JSON.stringify(payload)
  } catch {
    if (res.headersSent) {
      res.destroy()
      return
    }
    serialized = JSON.stringify({ error: 'Failed to serialize RPC response' })
    status = 500
  }
  try {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(serialized)
  } catch {
    if (!res.headersSent) {
      try {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Failed to send RPC response' }))
      } catch {
        res.destroy()
      }
    }
  }
}

function truncateResult(value: unknown, totalSize: number, maxSize: number): unknown {
  if (Array.isArray(value)) {
    const keepCount = Math.max(1, Math.floor(value.length * maxSize / totalSize))
    return {
      _truncated: true,
      _totalItems: value.length,
      _shownItems: keepCount,
      _message: `Result truncated: ${totalSize} bytes exceeds ${maxSize} byte limit. Showing ${keepCount}/${value.length} items.`,
      data: value.slice(0, keepCount)
    }
  }
  if (isPlainRecord(value)) {
    const keys = Object.keys(value)
    const keepCount = Math.max(1, Math.floor(keys.length * maxSize / totalSize))
    const partial: Record<string, unknown> = {}
    for (const key of keys.slice(0, keepCount)) {
      partial[key] = value[key]
    }
    return {
      _truncated: true,
      _totalKeys: keys.length,
      _shownKeys: keepCount,
      _message: `Result truncated: ${totalSize} bytes exceeds ${maxSize} byte limit. Showing ${keepCount}/${keys.length} keys.`,
      data: partial
    }
  }
  return {
    _truncated: true,
    _totalBytes: totalSize,
    _message: `Result truncated: ${totalSize} bytes exceeds ${maxSize} byte limit.`,
    data: String(value).slice(0, maxSize)
  }
}

type RpcReply = { status: number, payload: unknown }

async function readRpcBody(req: IncomingMessage, maxBytes: number): Promise<{ body: string } | RpcReply> {
  const chunks: Buffer[] = []
  let byteCount = 0
  for await (const chunk of req) {
    const buf: Buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
    byteCount += buf.length
    if (byteCount > maxBytes) return { status: 413, payload: { error: 'Request body exceeds size limit' } }
    chunks.push(buf)
  }
  return { body: Buffer.concat(chunks).toString('utf8') }
}

async function dispatchToolCall(exec: Execution, name: string, args: unknown): Promise<RpcReply> {
  if (name === RETURN_TOOL) {
    if (exec.returned) return { status: 400, payload: { error: 'Return value already received for this execution' } }
    exec.restoreContext(exec.onReturn, args)
    exec.returned = true
    return { status: 200, payload: { result: { ok: true } } }
  }
  const fn = exec.fns[name]
  if (!fn) return { status: 400, payload: { error: `Unknown tool: ${name}` } }
  exec.rpcCallCount++
  if (exec.rpcCallCount > exec.maxToolCalls) {
    return { status: 429, payload: { error: `Tool call limit exceeded (max ${exec.maxToolCalls})` } }
  }
  const result = await exec.restoreContext(fn, args)
  const serialized = JSON.stringify(result)
  if (serialized && serialized.length > exec.maxToolResponseSize) {
    return { status: 200, payload: { result: truncateResult(result, serialized.length, exec.maxToolResponseSize) } }
  }
  return { status: 200, payload: { result } }
}

async function buildRpcReply(req: IncomingMessage, state: RpcState): Promise<RpcReply> {
  if (req.headers['x-rpc-token'] !== state.token) return { status: 403, payload: { error: 'Forbidden' } }
  const bodyResult = await readRpcBody(req, state.maxRequestBodyBytes)
  if ('status' in bodyResult) return bodyResult
  const parsed = parseRpcBody(bodyResult.body)
  if (!parsed) return { status: 400, payload: { error: 'Invalid RPC body' } }
  const exec = state.executions.get(parsed.execId)
  if (!exec) return { status: 400, payload: { error: `Unknown execution: ${parsed.execId}` } }
  if (Date.now() > exec.deadlineMs) return { status: 408, payload: { error: 'Execution wall-clock timeout exceeded' } }
  return dispatchToolCall(exec, parsed.tool, parsed.args)
}

async function handleRpcRequest(req: IncomingMessage, res: ServerResponse, state: RpcState): Promise<void> {
  try {
    const reply = await buildRpcReply(req, state)
    sendJson(res, reply.status, reply.payload)
  } catch (err) {
    sendJson(res, 500, { error: sanitizeErrorMessage(getErrorMessage(err)) })
  }
}

function ensureRpcServer(maxRequestBodyBytes: number): Promise<RpcState> {
  if (rpcState) return Promise.resolve(rpcState)
  if (rpcStatePromise) return rpcStatePromise
  rpcStatePromise = new Promise<RpcState>((resolve, reject) => {
    const token = randomBytes(32).toString('hex')
    const executions = new Map<string, Execution>()
    let stateRef: RpcState | null = null
    const server: Server = createServer((req, res) => {
      if (!stateRef) {
        sendJson(res, 503, { error: 'RPC server not ready' })
        return
      }
      const state = stateRef
      handleRpcRequest(req, res, state).catch(() => {
        if (!res.headersSent) {
          try {
            sendJson(res, 500, { error: 'Internal server error' })
          } catch {
            res.destroy()
          }
        }
      })
    })
    const onError = (err: Error): void => {
      rpcStatePromise = null
      try {
        server.close()
      } catch { /* ignore */ }
      reject(err)
    }
    server.once('error', onError)
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      server.off('error', onError)
      if (!addr || typeof addr === 'string') {
        reject(new Error('RPC server has no address'))
        return
      }
      stateRef = { server, port: addr.port, token, executions, maxRequestBodyBytes }
      rpcState = stateRef
      resolve(stateRef)
    })
  })
  return rpcStatePromise
}

function createRpcOnlyAdapter(allowedPort: number): NetworkAdapter {
  return {
    async fetch(url, options) {
      const parsed = new URL(url)
      if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
        throw new Error(`Network access restricted to RPC server (blocked host: ${parsed.hostname})`)
      }
      if (Number(parsed.port) !== allowedPort) {
        throw new Error(`Network access restricted to RPC server (blocked port: ${parsed.port})`)
      }
      const resp = await globalThis.fetch(url, {
        method: options?.method ?? 'GET',
        headers: options?.headers,
        body: options?.body ?? undefined,
        redirect: 'error'
      })
      const body = await resp.text()
      const headers: Record<string, string> = {}
      resp.headers.forEach((v, k) => {
        headers[k] = v
      })
      return {
        ok: resp.ok,
        status: resp.status,
        statusText: resp.statusText,
        headers,
        body,
        url,
        redirected: false
      }
    },
    async dnsLookup() {
      return { error: 'DNS not available in code mode', code: 'ENOSYS' }
    },
    async httpRequest() {
      throw new Error('Raw HTTP not available in code mode')
    }
  }
}

function buildProxyBoilerplate(toolNames: string[], port: number, token: string): string {
  for (const name of toolNames) {
    if (!SAFE_IDENTIFIER.test(name)) {
      throw new Error(`Unsafe tool name rejected: "${name}"`)
    }
  }
  const proxyMethods = toolNames.map(name => `  ${name}: (input) => rpc('${name}', input)`).join(',\n')
  return `
async function rpc(toolName, args) {
  const res = await fetch('http://127.0.0.1:${port}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-rpc-token': '${token}' },
    body: JSON.stringify({ tool: toolName, args, execId: __execId }),
  });
  const data = JSON.parse(typeof res.text === 'function' ? await res.text() : res.body);
  if (data.error) throw new Error(data.error);
  return data.result;
}

const codemode = {
${proxyMethods}
};`
}

function buildSandboxCode(userCode: string, toolNames: string[], port: number, token: string, execId: string): string {
  const boilerplate = buildProxyBoilerplate(toolNames, port, token)
  return `const __execId = ${JSON.stringify(execId)};
${boilerplate}

const __fn = async () => {
${userCode}
};
__fn().then(
  (r) => rpc('${RETURN_TOOL}', r === undefined ? null : r),
  (e) => console.error('${ERROR_PREFIX}' + (e && e.message ? e.message : String(e)))
).catch(
  (e) => console.error('${ERROR_PREFIX}' + 'Result delivery failed: ' + (e && e.message ? e.message : String(e)))
);
`
}

function ensureRuntime(rpcPort: number): NodeRuntime {
  if (runtimeInstance) return runtimeInstance
  runtimeInstance = new NodeRuntime({
    systemDriver: createNodeDriver({
      networkAdapter: createRpcOnlyAdapter(rpcPort),
      permissions: { network: () => ({ allow: true }) }
    }),
    runtimeDriverFactory: createNodeRuntimeDriverFactory(),
    memoryLimit: 64,
    cpuTimeLimitMs: 10_000
  })
  return runtimeInstance
}

function makeStdioCollector(logs: string[]): { onStdio: (e: { channel: string, message: string }) => void, getError: () => string | undefined } {
  let errorMsg: string | undefined
  return {
    getError: () => errorMsg,
    onStdio: ({ channel, message }) => {
      if (channel === 'stderr' && message.startsWith(ERROR_PREFIX)) {
        errorMsg = message.slice(ERROR_PREFIX.length)
        return
      }
      if (logs.length < MAX_LOG_ENTRIES) {
        logs.push(`[${channel}] ${message}`)
        return
      }
      if (logs.length === MAX_LOG_ENTRIES) {
        logs.push(`... log output truncated at ${MAX_LOG_ENTRIES} entries`)
      }
    }
  }
}

function packageReturned(value: unknown, maxSize: number, logs: string[]): ExecResult {
  const serialized = JSON.stringify(value)
  if (!serialized || serialized.length <= maxSize) return { result: value, logs }
  return { result: truncateResult(value, serialized.length, maxSize), logs }
}

function registerExecution(
  rpc: RpcState,
  fns: CodeFns,
  options: ExecOptions | undefined,
  setReturned: (value: unknown) => void
): string {
  const execId = randomBytes(8).toString('hex')
  rpc.executions.set(execId, {
    fns,
    onReturn: setReturned,
    returned: false,
    restoreContext: AsyncLocalStorage.snapshot(),
    deadlineMs: Date.now() + (options?.wallTimeLimitMs ?? DEFAULT_WALL_TIME_LIMIT_MS),
    rpcCallCount: 0,
    maxToolCalls: options?.maxToolCalls ?? DEFAULT_MAX_TOOL_CALLS,
    maxToolResponseSize: options?.maxToolResponseSize ?? DEFAULT_MAX_TOOL_RESPONSE_SIZE
  })
  return execId
}

async function runSandbox(
  code: string,
  fns: CodeFns,
  rpc: RpcState,
  execId: string,
  options: ExecOptions | undefined,
  logs: string[],
  returnedRef: { value: unknown, received: boolean }
): Promise<ExecResult> {
  const sandboxCode = buildSandboxCode(code, Object.keys(fns), rpc.port, rpc.token, execId)
  const runtime = ensureRuntime(rpc.port)
  const collector = makeStdioCollector(logs)
  const execResult = await runtime.exec(sandboxCode, { onStdio: collector.onStdio })
  const errorMsg = collector.getError()
  if (execResult.code !== 0 || errorMsg) {
    return { error: errorMsg ?? execResult.errorMessage ?? `Exit code ${execResult.code}`, logs }
  }
  if (returnedRef.received) {
    return packageReturned(returnedRef.value, options?.maxResultSize ?? DEFAULT_MAX_RESULT_SIZE, logs)
  }
  return { logs }
}

export async function executeCode(code: string, fns: CodeFns, options?: ExecOptions): Promise<ExecResult> {
  const logs: string[] = []
  if (typeof AsyncLocalStorage.snapshot !== 'function') {
    return {
      error: 'Code Mode requires Node.js >=18.16.0 (AsyncLocalStorage.snapshot is unavailable).',
      logs
    }
  }
  const returnedRef: { value: unknown, received: boolean } = { value: undefined, received: false }
  const rpc = await ensureRpcServer(options?.maxRequestBodyBytes ?? DEFAULT_MAX_REQUEST_BODY_BYTES)
  const execId = registerExecution(rpc, fns, options, (value) => {
    returnedRef.value = value
    returnedRef.received = true
  })
  try {
    return await runSandbox(code, fns, rpc, execId, options, logs, returnedRef)
  } catch (err) {
    return { error: sanitizeErrorMessage(getErrorMessage(err)), logs }
  } finally {
    rpc.executions.delete(execId)
  }
}
