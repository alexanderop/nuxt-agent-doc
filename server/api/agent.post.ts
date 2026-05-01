import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  stepCountIs
} from 'ai'
import type { ToolSet } from 'ai'
import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { buildSystemPrompt } from '../utils/system-prompt'

const MAX_STEPS = 8
const MODEL = 'anthropic/claude-sonnet-4.6'

export default defineEventHandler(async (event) => {
  const raw = await readBody(event) as { messages?: unknown }
  const validated = await safeValidateUIMessages({ messages: raw?.messages })
  if (!validated.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid messages' })
  }

  const pagePath = getHeader(event, 'x-page-path')?.trim() ?? null

  const abort = new AbortController()
  event.node.req.once('close', () => abort.abort())

  const mcp = await createMCPClient({
    transport: { type: 'http', url: `${getRequestURL(event).origin}/mcp` }
  })
  let mcpTools: Awaited<ReturnType<typeof mcp.tools>>
  try {
    mcpTools = await mcp.tools()
  } catch (err) {
    await mcp.close()
    throw err
  }
  const closeMcp = () => event.waitUntil(mcp.close())

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: MODEL,
        maxOutputTokens: 2000,
        abortSignal: abort.signal,
        stopWhen: stepCountIs(MAX_STEPS),
        system: buildSystemPrompt(pagePath),
        messages: await convertToModelMessages(validated.data),
        tools: mcpTools as ToolSet,
        onFinish: closeMcp,
        onAbort: closeMcp,
        onError: closeMcp
      })
      writer.merge(result.toUIMessageStream({ originalMessages: validated.data }))
    }
  })
  return createUIMessageStreamResponse({ stream })
})
