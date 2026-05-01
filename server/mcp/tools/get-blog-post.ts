import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export default defineMcpTool({
  name: 'get_blog_post',
  description: 'Fetch the full markdown of a single blog post by slug (e.g. `/blog/7-agent-team-patterns-for-claude-code`). Use after `list_blog_posts` when you know which post the user wants, or when they paste a URL. Returns title, description, tags, pubDatetime, and the raw markdown body. Drafts are excluded; an unknown slug returns an error.',
  inputSchema: {
    slug: z.string().describe('Post slug, e.g. "/blog/7-agent-team-patterns-for-claude-code". Leading "/blog/" is added automatically if missing.')
  },
  handler: async ({ slug }) => {
    const event = useEvent()
    const path = normalizeContentSlug(slug, 'blog')
    const row = await queryCollection(event, 'blog')
      .where('path', '=', path)
      .where('draft', '=', false)
      .first()
    if (!row) {
      throw createError({ statusCode: 404, message: `No published blog post at ${path}` })
    }
    return [
      `# ${row.title}`,
      '',
      formatMetaLine(row.pubDatetime, row.tags),
      '',
      row.description,
      '',
      '---',
      '',
      stripFrontmatter(row.rawbody)
    ].join('\n')
  }
})
