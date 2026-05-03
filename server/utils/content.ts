type ContentCollection = 'blog' | 'notes' | 'til'

export function normalizeContentSlug(input: string, collection: ContentCollection): string {
  let s = input.trim()
  if (s.startsWith('http://') || s.startsWith('https://')) s = new URL(s).pathname
  if (!s.startsWith('/')) s = '/' + s
  if (!s.startsWith(`/${collection}/`)) s = `/${collection}${s}`
  return s
}

export function stripFrontmatter(md: string): string {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, '')
}

export function formatMetaLine(pubDatetime: Date | string, tags: readonly string[] | undefined): string {
  const date = new Date(pubDatetime).toISOString().slice(0, 10)
  const tagList = tags?.length ? tags.join(', ') : 'none'
  return `*${date} — tags: ${tagList}*`
}
