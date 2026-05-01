// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/a11y',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/ui'
  ],
  devtools: { enabled: true },
  compatibilityDate: '2026-05-01'
})
