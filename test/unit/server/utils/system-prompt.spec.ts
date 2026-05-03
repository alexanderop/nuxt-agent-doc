import { describe, expect, it } from 'vitest'
import { buildSystemPrompt } from '../../../../server/utils/system-prompt'

describe('buildSystemPrompt', () => {
  it('omits the page line when no path is provided', () => {
    const prompt = buildSystemPrompt(null)

    expect(prompt).not.toContain('Current page:')
    expect(prompt).toContain('list_blog_posts')
  })

  it('prepends a "Current page" hint for valid blog paths', () => {
    const prompt = buildSystemPrompt('/blog/atomic')

    expect(prompt.startsWith('Current page: /blog/atomic\n\n')).toBe(true)
  })

  it('drops the page hint when the path contains traversal', () => {
    const prompt = buildSystemPrompt('/blog/../etc/passwd')

    expect(prompt).not.toContain('Current page:')
  })

  it('drops the page hint when the path has a doubled slash', () => {
    expect(buildSystemPrompt('//evil')).not.toContain('Current page:')
  })

  it('drops the page hint when the path is over 256 chars', () => {
    const longPath = '/blog/' + 'a'.repeat(260)

    expect(buildSystemPrompt(longPath)).not.toContain('Current page:')
  })

  it('drops the page hint for malformed paths (missing leading slash)', () => {
    expect(buildSystemPrompt('blog/atomic')).not.toContain('Current page:')
  })

  it('appends the code-mode addendum only when mode is "code"', () => {
    const classical = buildSystemPrompt('/blog/atomic', 'classical')
    const code = buildSystemPrompt('/blog/atomic', 'code')

    expect(classical).not.toContain('# Code Mode')
    expect(code).toContain('# Code Mode')
    expect(code).toContain('codemode.list_blog_posts')
  })
})
