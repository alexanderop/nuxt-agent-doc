import type { Locator, Page, Response } from '@playwright/test'

export type ColorMode = 'light' | 'dark'

declare global {
  interface Window {
    useNuxtApp?: () => { isHydrating: boolean }
  }
}

/**
 * Page object covering the blog's chrome (skip link, header, navigation,
 * color-mode toggle, footer) — the bits shared by every route.
 */
export class BlogApp {
  readonly page: Page
  readonly skipLink: Locator
  readonly siteLink: Locator
  readonly main: Locator
  readonly nav: Locator
  readonly colorModeButton: Locator
  readonly heading: Locator

  constructor(page: Page) {
    this.page = page
    this.skipLink = page.getByRole('link', { name: /skip to main content/i })
    this.siteLink = page.getByRole('link', { name: 'alexop.dev' })
    this.main = page.locator('#main-content')
    this.nav = page.getByRole('navigation')
    this.colorModeButton = page.getByRole('button', { name: /switch to (light|dark) mode/i })
    this.heading = page.locator('h1').first()
  }

  static async withColorMode(page: Page, mode: ColorMode): Promise<void> {
    await page.addInitScript((m: ColorMode) => {
      localStorage.setItem('nuxt-color-mode', m)
    }, mode)
  }

  async goto(path: string): Promise<Response | null> {
    return this.page.goto(path)
  }

  /** Wait until Nuxt has finished hydrating so we can assert on client-only state. */
  async waitForHydration(): Promise<void> {
    await this.page.waitForFunction(() => Boolean(window.useNuxtApp?.().isHydrating === false))
  }

  navLink(label: string): Locator {
    return this.nav.getByRole('link', { name: label })
  }
}
