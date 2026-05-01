import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export default defineMcpTool({
  name: 'get_note',
  description: 'Fetch the full markdown of one of Alex\'s notes by slug (e.g. `/notes/writing-good-tests-for-vue-applications`). Use after `list_notes` or when you have a known slug. Returns the note\'s metadata (sourceType, sourceAuthor, sourceUrl, rating, cover) plus highlights (quotes with optional commentary) and the raw markdown body.',
  inputSchema: {
    slug: z.string().describe('Note slug, e.g. "/notes/writing-good-tests-for-vue-applications". Leading "/notes/" is added automatically if missing.')
  },
  handler: async ({ slug }) => {
    const event = useEvent()
    const path = normalizeContentSlug(slug, 'notes')
    const row = await queryCollection(event, 'notes')
      .where('path', '=', path)
      .where('draft', '=', false)
      .first()
    if (!row) {
      throw createError({ statusCode: 404, message: `No published note at ${path}` })
    }

    const meta: string[] = [
      `# ${row.title}`,
      '',
      formatMetaLine(row.pubDatetime, row.tags),
      '',
      `**Source:** ${row.sourceType} by ${row.sourceAuthor}${row.sourceUrl ? ` — ${row.sourceUrl}` : ''}`
    ]
    if (typeof row.rating === 'number') meta.push(`**Rating:** ${row.rating}/5`)
    if (row.cover) meta.push(`**Cover:** ${row.cover}`)
    meta.push('', row.description ?? '', '', '---', '')

    const sections = [meta.join('\n'), stripFrontmatter(row.rawbody)]

    if (row.highlights?.length) {
      const lines = ['## Highlights', '']
      for (const h of row.highlights) {
        const loc = h.timestamp ?? (typeof h.page === 'number' ? `p. ${h.page}` : null)
        lines.push(`> ${h.quote}${loc ? ` — *${loc}*` : ''}`)
        if (h.comment) lines.push('', h.comment)
        lines.push('')
      }
      sections.push(lines.join('\n'))
    }

    return sections.join('\n')
  }
})
