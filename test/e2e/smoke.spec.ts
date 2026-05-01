import { BlogApp } from './pages/blog-app'
import { PostPage } from './pages/post-page'
import { expect, test } from './test-utils'

const ROUTES = [
  { path: '/', titlePattern: /Alexander Opalic/, h1: 'Hi, I\'m Alex.' },
  { path: '/blog', titlePattern: /Blog/, h1: 'Blog' },
  { path: '/blog/atomic', titlePattern: /Atomic Architecture/, h1: 'Atomic Architecture: Structuring Vue and Nuxt Projects' },
  { path: '/notes', titlePattern: /Notes/, h1: 'Notes' },
  {
    path: '/notes/software-testing-with-generative-ai',
    titlePattern: /Software Testing with Generative AI/,
    h1: 'Software Testing with Generative AI'
  },
  { path: '/til', titlePattern: /TIL/, h1: 'Today I Learned' },
  {
    path: '/til/dynamic-pinia-stores',
    titlePattern: /Dynamic Pinia Stores/,
    h1: 'Dynamic Pinia Stores in Vue 3'
  },
  { path: '/tags/vue', titlePattern: /#vue/, h1: '#vue' }
] as const

test.describe('smoke: prerendered pages render and don\'t mismatch on hydration', () => {
  for (const route of ROUTES) {
    test(`${route.path}`, async ({ page, hydrationErrors }) => {
      const app = new BlogApp(page)
      const response = await app.goto(route.path)

      expect(response?.status()).toBeLessThan(400)
      await expect(page).toHaveTitle(route.titlePattern)
      await expect(app.heading).toHaveText(route.h1)
      await expect(app.siteLink).toBeVisible()

      await app.waitForHydration()
      expect(hydrationErrors).toEqual([])
    })
  }

  test('skip-to-main link is the first focusable element and lands on <main>', async ({ page }) => {
    const app = new BlogApp(page)
    await app.goto('/')

    await page.keyboard.press('Tab')
    await expect(app.skipLink).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main-content$/)
    await expect(app.main).toBeFocused()
  })

  test('tag link from a post navigates to the tag page', async ({ page }) => {
    const post = new PostPage(page)
    await post.goto('/blog/atomic')
    await post.clickTag('vue')

    await expect(page).toHaveURL('/tags/vue')
    await expect(post.heading).toHaveText('#vue')
  })
})

test.describe('smoke: RSS feed', () => {
  test('returns valid rss with at least one item', async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/rss.xml`)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('application/rss+xml')

    const body = await res.text()
    expect(body).toContain('<rss')
    expect(body).toContain('<title>alexop.dev</title>')
    expect(body.match(/<item>/g)?.length ?? 0).toBeGreaterThan(0)
  })
})
