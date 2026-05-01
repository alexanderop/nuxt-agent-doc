import highlight from '@comark/nuxt/plugins/highlight'

export default defineComarkComponent({
  name: 'ChatComark',
  plugins: [highlight()],
  class: 'prose prose-sm dark:prose-invert max-w-none text-sm/6 *:first:mt-0 *:last:mb-0'
})
