import getBlogPost from './tools/get-blog-post'
import getNote from './tools/get-note'
import getTil from './tools/get-til'
import listBlogPosts from './tools/list-blog-posts'
import listNotes from './tools/list-notes'
import listTils from './tools/list-tils'

export default defineMcpHandler({
  name: 'code',
  description: 'Code Mode: same tools as /mcp, but exposed as a single `code` tool the LLM calls by writing JavaScript executed in a V8 isolate.',
  experimental_codeMode: true,
  tools: [getBlogPost, getNote, getTil, listBlogPosts, listNotes, listTils]
})
