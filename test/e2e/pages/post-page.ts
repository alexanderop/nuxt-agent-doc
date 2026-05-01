import type { Locator } from '@playwright/test'
import { BlogApp } from './blog-app'

/**
 * Page object for individual blog/notes/til detail routes.
 * Adds tag-badge handling on top of the shared chrome.
 */
export class PostPage extends BlogApp {
  readonly article: Locator = this.page.locator('article')
  readonly proseBody: Locator = this.page.locator('.prose')

  tagBadge(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true })
  }

  async clickTag(name: string): Promise<void> {
    await this.tagBadge(name).click()
  }
}
