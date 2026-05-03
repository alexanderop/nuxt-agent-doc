import { tool } from 'ai'
import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export const getTilSchema = z.object({
  slug: z.string().describe('TIL slug, e.g. "/til/dynamic-pinia-stores". Leading "/til/" is added automatically if missing.')
})

export const getTilHandler = async ({ slug }: z.infer<typeof getTilSchema>) => {
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

export const getTilTool = tool({
  description: 'Fetch the full markdown of a single TIL entry by slug (e.g. `/til/dynamic-pinia-stores`). Use after `list_tils` or with a known slug. Returns title, description, tags, pubDatetime, and the raw markdown body.',
  inputSchema: getTilSchema,
  execute: getTilHandler
})
