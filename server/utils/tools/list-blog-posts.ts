import { tool } from 'ai'
import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export const listBlogPostsSchema = z.object({
  tag: z.string().regex(/^[a-z0-9-]+$/, 'Tag must be lowercase letters, digits, or dashes').optional().describe('Exact tag to filter by, e.g. "vue", "typescript". Omit to list all posts.'),
  limit: z.number().int().min(1).max(50).default(20).describe('Max posts to return (1–50, default 20).')
})

export const listBlogPostsHandler = async ({ tag, limit }: z.infer<typeof listBlogPostsSchema>) => {
  const event = useEvent()
  let q = queryCollection(event, 'blog')
    .select('title', 'path', 'description', 'tags', 'pubDatetime')
    .where('draft', '=', false)
    .order('pubDatetime', 'DESC')
    .limit(limit)
  if (tag) q = q.where('tags', 'LIKE', `%"${tag}"%`)
  const rows = await q.all()
  return rows.map(r => ({
    title: r.title,
    slug: r.path,
    description: r.description,
    tags: r.tags,
    pubDatetime: r.pubDatetime
  }))
}

export const listBlogPostsTool = tool({
  description: 'List Alex Opalic\'s published blog posts, newest first. Use this to discover what Alex has written about a topic, browse his recent thinking, or find a post by tag before fetching its full text. Optional `tag` filters to posts carrying that exact tag (e.g. `vue`, `typescript`, `nuxt`). Returns an array of `{ title, slug, description, tags, pubDatetime }`. Call `get_blog_post` afterwards to read the full markdown of one.',
  inputSchema: listBlogPostsSchema,
  execute: listBlogPostsHandler
})
