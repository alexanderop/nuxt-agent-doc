import highlight from '@comark/nuxt/plugins/highlight'
import mermaid, { Mermaid } from '@comark/nuxt/plugins/mermaid'

export default defineComarkComponent({
  name: 'ChatComark',
  plugins: [
    highlight(),
    mermaid({ theme: 'github-light', themeDark: 'github-dark' })
  ],
  components: { Mermaid },
  class: 'prose prose-sm dark:prose-invert max-w-none text-sm/6 *:first:mt-0 *:last:mb-0'
})
