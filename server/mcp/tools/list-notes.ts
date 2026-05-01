import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export default defineMcpTool({
  name: 'list_notes',
  description: 'List Alex\'s notes — his summaries and highlights from books, articles, videos, and podcasts he has read or watched. Use this when the user asks what Alex thinks of a particular book or source, what he has been reading, or wants source-grounded opinions rather than original posts. Optional `tag` filter and `sourceType` filter. Returns each item with `title, slug, description, tags, pubDatetime, sourceType, sourceAuthor, rating`.',
  inputSchema: {
    tag: z.string().regex(/^[a-z0-9-]+$/, 'Tag must be lowercase letters, digits, or dashes').optional().describe('Exact tag to filter by, e.g. "testing", "ai".'),
    sourceType: z.enum(['book', 'video', 'article', 'podcast', 'other']).optional().describe('Filter to one source type.'),
    limit: z.number().int().min(1).max(50).default(20).describe('Max notes to return (1–50, default 20).')
  },
  handler: async ({ tag, sourceType, limit }) => {
    const event = useEvent()
    let q = queryCollection(event, 'notes')
      .select('title', 'path', 'description', 'tags', 'pubDatetime', 'sourceType', 'sourceAuthor', 'rating')
      .where('draft', '=', false)
      .order('pubDatetime', 'DESC')
      .limit(limit)
    if (tag) q = q.where('tags', 'LIKE', `%"${tag}"%`)
    if (sourceType) q = q.where('sourceType', '=', sourceType)
    const rows = await q.all()
    return rows.map(r => ({
      title: r.title,
      slug: r.path,
      description: r.description,
      tags: r.tags,
      pubDatetime: r.pubDatetime,
      sourceType: r.sourceType,
      sourceAuthor: r.sourceAuthor,
      rating: r.rating
    }))
  }
})
