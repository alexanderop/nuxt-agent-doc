// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/a11y',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@comark/nuxt',
    'evlog/nuxt'
  ],
  devtools: { enabled: true },
  app: {
    head: {
      htmlAttrs: { lang: 'en' }
    }
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    cronSecret: ''
  },
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { prerender: true },
    '/notes/**': { prerender: true },
    '/til/**': { prerender: true },
    '/tags/**': { prerender: true },
    '/rss.xml': { prerender: true }
  },
  experimental: {
    viteEnvironmentApi: true
  },
  compatibilityDate: '2026-05-01',
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false
    },
    experimental: {
      asyncContext: true
    },
    devStorage: {
      'cache:nuxt:payload': { driver: 'memory' }
    }
  },
  vite: {
    build: { sourcemap: false },
    optimizeDeps: {
      include: ['beautiful-mermaid', 'elkjs/lib/elk.bundled.js']
    }
  },
  evlog: {
    env: { service: 'nuxt-agent-doc' }
  }
})
