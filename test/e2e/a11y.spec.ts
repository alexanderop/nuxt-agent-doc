import { AxeBuilder } from '@axe-core/playwright'
import { BlogApp, type ColorMode } from './pages/blog-app'
import { expect, test } from './test-utils'

const ROUTES = [
  '/',
  '/blog',
  '/blog/atomic',
  '/notes',
  '/notes/software-testing-with-generative-ai',
  '/til',
  '/til/dynamic-pinia-stores',
  '/tags/vue'
] as const

const MODES: readonly ColorMode[] = ['light', 'dark']

const SEVERE_IMPACTS = ['serious', 'critical'] as const

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// Migrated post bodies are out of Phase 2's blast radius — exclude .prose so we
// audit the chrome (header, footer, layout, navigation, list pages) only.
const EXCLUDE_SELECTORS = ['.prose']

test.describe('a11y: no serious or critical axe violations', () => {
  for (const mode of MODES) {
    test.describe(`${mode} mode`, () => {
      for (const path of ROUTES) {
        test(path, async ({ page }) => {
          await BlogApp.withColorMode(page, mode)
          const app = new BlogApp(page)
          await app.goto(path)

          let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS)
          for (const selector of EXCLUDE_SELECTORS) builder = builder.exclude(selector)

          const { violations } = await builder.analyze()
          const severe = violations.filter(v => SEVERE_IMPACTS.includes(v.impact as typeof SEVERE_IMPACTS[number]))

          expect(
            severe,
            severe.map(v => `${v.id} (${v.impact}): ${v.help} — ${v.helpUrl}`).join('\n')
          ).toEqual([])
        })
      }
    })
  }
})
