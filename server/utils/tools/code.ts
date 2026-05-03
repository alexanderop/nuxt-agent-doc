import { tool } from 'ai'
import { z } from 'zod'
import { executeCode } from '../code-runtime'
import { contentToolFns } from './content-fns'

export const codeTool = tool({
  description:
    'Execute a JavaScript scratchpad that can call the blog tools as `codemode.<tool_name>(input)` (returns a Promise). Chain list+get calls in ONE invocation using `.find` / `.filter` / `Promise.all`. Inspect intermediate results inline and `return` once you have everything needed. Available: list_blog_posts, get_blog_post, list_notes, get_note, list_tils, get_til.',
  inputSchema: z.object({
    code: z.string().describe('JavaScript body. Use `await codemode.<tool>(input)` and `return` your final value.')
  }),
  execute: ({ code }) => executeCode(code, contentToolFns)
})
