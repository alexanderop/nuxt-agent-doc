import { tool } from 'ai'
import type { UIMessageStreamWriter } from 'ai'
import { z } from 'zod'
import { executeCode } from '../code-runtime'
import { contentToolFns } from './content-fns'
import { SUBTOOL_CALL_PART_TYPE, type SubToolCall } from '~~/shared/agent-telemetry'

const RESULT_SUMMARY_MAX = 80

function summarizeResult(value: unknown): string {
  let serialized: string
  try {
    serialized = typeof value === 'string' ? value : JSON.stringify(value)
  } catch {
    serialized = String(value)
  }
  if (serialized.length <= RESULT_SUMMARY_MAX) return serialized
  return `${serialized.slice(0, RESULT_SUMMARY_MAX)}…`
}

function summarizeEnd(event: { error?: string, result?: unknown }): string | undefined {
  if (event.error) return `error: ${event.error}`
  if (event.result !== undefined) return summarizeResult(event.result)
  return undefined
}

export type CreateCodeToolOptions = {
  writer: UIMessageStreamWriter
  onSubToolCall?: () => void
}

export function createCodeTool(opts: CreateCodeToolOptions) {
  return tool({
    description:
      'Execute a JavaScript scratchpad that can call the blog tools as `codemode.<tool_name>(input)` (returns a Promise). Chain list+get calls in ONE invocation using `.find` / `.filter` / `Promise.all`. Inspect intermediate results inline and `return` once you have everything needed. Available: list_blog_posts, get_blog_post, list_notes, get_note, list_tils, get_til.',
    inputSchema: z.object({
      code: z.string().describe('JavaScript body. Use `await codemode.<tool>(input)` and `return` your final value.')
    }),
    execute: ({ code }, { toolCallId }) => executeCode(code, contentToolFns, {
      onSubToolCall: (event) => {
        const data: SubToolCall = {
          codeToolCallId: toolCallId,
          seq: event.seq,
          name: event.name,
          startedAt: event.startedAt
        }
        if (event.kind === 'end') {
          data.endedAt = event.endedAt
          data.resultSummary = summarizeEnd(event)
        }
        if (event.kind === 'start') opts.onSubToolCall?.()
        opts.writer.write({
          type: SUBTOOL_CALL_PART_TYPE,
          id: `${toolCallId}-${event.seq}`,
          data
        })
      }
    })
  })
}
