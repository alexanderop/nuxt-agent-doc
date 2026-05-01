import { AxeBuilder } from '@axe-core/playwright'
import { BlogApp } from './pages/blog-app'
import { expect, test } from './test-utils'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const SEVERE_IMPACTS = ['serious', 'critical'] as const
type SevereImpact = typeof SEVERE_IMPACTS[number]

function isSevereImpact(impact: unknown): impact is SevereImpact {
  return impact === 'serious' || impact === 'critical'
}

const askButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: /ask my blog/i })

const dialog = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog')

test.describe('chat slideover: open/close', () => {
  test('clicking "Ask my blog" opens the slideover and Esc closes it', async ({ page }) => {
    const app = new BlogApp(page)
    await app.goto('/')
    await app.waitForHydration()

    await expect(dialog(page)).toBeHidden()

    await askButton(page).click()
    await expect(dialog(page)).toBeVisible()
    await expect(page.getByPlaceholder(/ask anything/i)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog(page)).toBeHidden()
  })

  test('on a post page the slideover surfaces a "Using context" toggle', async ({ page }) => {
    const app = new BlogApp(page)
    await app.goto('/blog/atomic')
    await app.waitForHydration()

    await askButton(page).click()
    const checkbox = page.getByRole('checkbox', { name: /using context: \/blog\/atomic/i })
    await expect(checkbox).toBeVisible()
    await expect(checkbox).toBeChecked()

    await checkbox.click()
    await expect(checkbox).not.toBeChecked()
  })

  test('on the home page no context toggle is offered', async ({ page }) => {
    const app = new BlogApp(page)
    await app.goto('/')
    await app.waitForHydration()

    await askButton(page).click()
    await expect(dialog(page)).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /using context/i })).toHaveCount(0)
  })
})

test.describe('chat slideover: a11y', () => {
  test('no serious or critical axe violations with the slideover open', async ({ page }) => {
    const app = new BlogApp(page)
    await app.goto('/')
    await app.waitForHydration()

    await askButton(page).click()
    await expect(dialog(page)).toBeVisible()

    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .exclude('.prose')
      .analyze()

    const severe = violations.filter(v => isSevereImpact(v.impact))
    expect(
      severe,
      severe.map(v => `${v.id} (${v.impact}): ${v.help} — ${v.helpUrl}`).join('\n')
    ).toEqual([])
  })
})
