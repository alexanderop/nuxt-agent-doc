import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export default defineMcpTool({
  name: 'get_til',
  description: 'Fetch the full markdown of a single TIL entry by slug (e.g. `/til/dynamic-pinia-stores`). Use after `list_tils` or with a known slug. Returns title, description, tags, pubDatetime, and the raw markdown body.',
  inputSchema: {
    slug: z.string().describe('TIL slug, e.g. "/til/dynamic-pinia-stores". Leading "/til/" is added automatically if missing.')
  },
  handler: async ({ slug }) => {
    const event = useEvent()
    const path = normalizeContentSlug(slug, 'til')
    const row = await queryCollection(event, 'til')
      .where('path', '=', path)
      .where('draft', '=', false)
      .first()
    if (!row) {
      throw createError({ statusCode: 404, message: `No published TIL at ${path}` })
    }
    return [
      `# ${row.title}`,
      '',
      formatMetaLine(row.pubDatetime, row.tags),
      '',
      row.description ?? '',
      '',
      '---',
      '',
      stripFrontmatter(row.rawbody)
    ].join('\n')
  }
})
