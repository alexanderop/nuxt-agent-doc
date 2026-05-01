// One-off migration: Astro mdx -> Nuxt Content md.
// usage: node --experimental-strip-types scripts/migrate-mdx.ts
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const SRC = '/Users/alexanderopalic/Projects/content/blog-astro/src/content'
const DST = './content'
const COLLECTIONS = ['blog', 'notes', 'til'] as const

const FENCE_RE = /```[\s\S]*?```|~~~[\s\S]*?~~~/g
// Private-Use-Area sentinel chars — never appear in real content, not control characters.
const FENCE_OPEN = '\u{E000}'
const FENCE_CLOSE = '\u{E001}'
const FENCE_TOKEN_RE = /\u{E000}(\d+)\u{E001}/gu

function clean(raw: string): string {
  // Stash fenced code blocks so transforms don't touch sample code,
  // and so MDX wrappers around code (e.g. <CodeComparison>...</CodeComparison>)
  // remain matchable as opener/closer pairs once the inner fence is hidden.
  const fences: string[] = []
  let s = raw.replace(FENCE_RE, (m) => {
    fences.push(m)
    return `${FENCE_OPEN}${fences.length - 1}${FENCE_CLOSE}`
  })

  s = s
    .replace(/^import\s.+$/gm, '')
    .replace(/<InternalLink\s+slug="([^"]+)">([^<]+)<\/InternalLink>/g, '[$2](/blog/$1)')
    .replace(/<Alert(?:\s[^>]*)?>([\s\S]*?)<\/Alert>/g, '> $1')
    .replace(/<Aside(?:\s[^>]*)?>([\s\S]*?)<\/Aside>/g, '> $1')

  // Iterate until stable so nested components unwrap fully.
  // Three patterns:
  //  1. self-closing on a single line: `<Tag attrs />`
  //  2. self-closing across lines, `/>` at end of line: handles JSX exprs whose `>` chars (mermaid arrows) defeat `[^>]`
  //  3. paired open/close: `<Tag>...</Tag>`
  let prev: string
  do {
    prev = s
    s = s
      .replace(/<[A-Z][A-Za-z]+(?:\s[^>]*)?\/>/g, '')
      .replace(/<[A-Z][A-Za-z]+\s[\s\S]*?\/>[ \t]*$/gm, '')
      .replace(/<([A-Z][A-Za-z]+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g, '$2')
  } while (s !== prev)

  s = s.replace(FENCE_TOKEN_RE, (_, i) => fences[Number(i)])
  return s.replace(/\n{3,}/g, '\n\n')
}

async function migrateFile(srcPath: string, dstPath: string): Promise<void> {
  const raw = await readFile(srcPath, 'utf8')
  await writeFile(dstPath, clean(raw))
}

async function migrateCollection(c: string): Promise<number> {
  const srcDir = join(SRC, c)
  const dstDir = join(DST, c)
  await mkdir(dstDir, { recursive: true })
  const files = (await readdir(srcDir)).filter(f => /\.mdx?$/.test(f))
  await Promise.all(files.map(f =>
    migrateFile(join(srcDir, f), join(dstDir, f.replace(/\.mdx$/, '.md')))
  ))
  return files.length
}

const counts = await Promise.all(COLLECTIONS.map(c => migrateCollection(c).then(n => [c, n] as const)))
for (const [c, n] of counts) console.warn(`✓ ${c}: ${n} files`)
