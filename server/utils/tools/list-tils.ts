import { tool } from 'ai'
import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export const listTilsSchema = z.object({
  tag: z.string().regex(/^[a-z0-9-]+$/, 'Tag must be lowercase letters, digits, or dashes').optional().describe('Exact tag to filter by, e.g. "vue", "typescript".'),
  limit: z.number().int().min(1).max(50).default(20).describe('Max TILs to return (1–50, default 20).')
})

export const listTilsHandler = async ({ tag, limit }: z.infer<typeof listTilsSchema>) => {
  const event = useEvent()
  let q = queryCollection(event, 'til')
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

export const listTilsTool = tool({
  description: 'List Alex\'s TIL ("today I learned") entries — short, technical micro-posts capturing one specific thing he learned. Prefer this over `list_blog_posts` when the user asks for quick tips, syntax reminders, or single-concept explanations. Optional `tag` filter. Returns an array of `{ title, slug, description, tags, pubDatetime }`.',
  inputSchema: listTilsSchema,
  execute: listTilsHandler
})
