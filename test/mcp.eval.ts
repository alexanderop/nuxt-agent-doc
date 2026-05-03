import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { evalite } from 'evalite'
import { toolCallAccuracy } from 'evalite/scorers'
import { contentTools } from '../server/utils/tools'

const model = anthropic('claude-haiku-4-5-20251001')

const runRouting = async (input: string) => {
  const result = await generateText({ model, prompt: input, tools: contentTools })
  return result.toolCalls ?? []
}

evalite('Blog tools — routing', {
  data: async () => [
    { input: 'List Alex\'s blog posts tagged vue.', expected: [{ toolName: 'list_blog_posts', input: { tag: 'vue' } }] },
    { input: 'Get the blog post at slug /blog/atomic', expected: [{ toolName: 'get_blog_post', input: { slug: '/blog/atomic' } }] },
    { input: 'List recent TILs', expected: [{ toolName: 'list_tils' }] },
    { input: 'What books has Alex reviewed?', expected: [{ toolName: 'list_notes' }] },
    { input: 'hi', expected: [] }
  ],
  task: runRouting,
  scorers: [async ({ output, expected }) => toolCallAccuracy({ actualCalls: output, expectedCalls: expected })]
})
