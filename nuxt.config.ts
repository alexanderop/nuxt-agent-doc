// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/a11y',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/ui'
  ],
  devtools: { enabled: true },
  app: {
    head: {
      htmlAttrs: { lang: 'en' }
    }
  },
  css: ['~/assets/css/main.css'],
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { prerender: true },
    '/notes/**': { prerender: true },
    '/til/**': { prerender: true },
    '/tags/**': { prerender: true },
    '/rss.xml': { prerender: true }
  },
  compatibilityDate: '2026-05-01',
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false
    }
  }
})
