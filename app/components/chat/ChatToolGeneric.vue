<script setup lang="ts">
import type { UIMessage } from 'ai'
import { getToolName } from 'ai'
import { isToolStreaming } from '@nuxt/ui/utils/ai'

type ToolPart = Extract<UIMessage['parts'][number], { type: `tool-${string}` } | { type: 'dynamic-tool' }>

const { part } = defineProps<{ part: ToolPart }>()

type ToolMeta = { icon: string, streaming: string, done: string }
const TOOL_META: Record<string, ToolMeta> = {
  list_blog_posts: { icon: 'i-lucide-newspaper', streaming: 'Searching blog posts…', done: 'Searched blog posts' },
  get_blog_post: { icon: 'i-lucide-book-open', streaming: 'Reading blog post…', done: 'Read blog post' },
  list_notes: { icon: 'i-lucide-sticky-note', streaming: 'Searching notes…', done: 'Searched notes' },
  get_note: { icon: 'i-lucide-sticky-note', streaming: 'Reading note…', done: 'Read note' },
  list_tils: { icon: 'i-lucide-lightbulb', streaming: 'Searching TILs…', done: 'Searched TILs' },
  get_til: { icon: 'i-lucide-lightbulb', streaming: 'Reading TIL…', done: 'Read TIL' }
}

const meta = computed<ToolMeta>(() => {
  const name = getToolName(part)
  return TOOL_META[name] ?? { icon: 'i-lucide-wrench', streaming: `Running ${name}…`, done: name }
})
const streaming = computed(() => isToolStreaming(part))
const text = computed(() => streaming.value ? meta.value.streaming : meta.value.done)
const output = computed<string>(() => {
  if (part.state !== 'output-available') return ''
  const out = part.output
  if (typeof out === 'string') return out
  try {
    return JSON.stringify(out, null, 2)
  } catch {
    return String(out)
  }
})
</script>

<template>
  <UChatTool
    :icon="meta.icon"
    :streaming="streaming"
    :text="text"
    chevron="leading"
  >
    <pre v-if="output" class="text-xs text-dimmed whitespace-pre-wrap break-all px-2 py-1.5">{{ output }}</pre>
  </UChatTool>
</template>
