<script setup lang="ts">
import type { UIMessage } from 'ai'
import { isSubToolCallPart, type SubToolCall } from '~~/shared/agent-telemetry'

type ToolPart = Extract<UIMessage['parts'][number], { type: `tool-${string}` } | { type: 'dynamic-tool' }>

const { part, message } = defineProps<{ part: ToolPart, message: UIMessage }>()

const colorMode = useColorMode()

function readCode(input: unknown): string {
  if (input && typeof input === 'object' && 'code' in input) {
    const { code: value } = input
    if (typeof value === 'string') return value
  }
  return ''
}

const code = computed<string>(() => readCode(part.input))

type StateMeta = { label: string, color: string }
const STATE_META: Partial<Record<typeof part.state, StateMeta>> = {
  'input-streaming': { label: 'writing…', color: 'text-muted' },
  'output-available': { label: 'done', color: 'text-success' },
  'output-error': { label: 'error', color: 'text-error' },
  'output-denied': { label: 'denied', color: 'text-error' }
}
const RUNNING_META: StateMeta = { label: 'running…', color: 'text-muted' }
const meta = computed<StateMeta>(() => STATE_META[part.state] ?? RUNNING_META)

const output = computed<string>(() => {
  if (part.state === 'output-available') {
    const out = part.output
    if (typeof out === 'string') return out
    try {
      return JSON.stringify(out, null, 2)
    } catch {
      return String(out)
    }
  }
  if (part.state === 'output-error') return part.errorText ?? 'Unknown error'
  return ''
})

const codeToolCallId = computed<string | null>(() =>
  'toolCallId' in part && typeof part.toolCallId === 'string' ? part.toolCallId : null
)

const subToolCalls = computed<SubToolCall[]>(() => {
  const id = codeToolCallId.value
  if (!id) return []
  const collected: SubToolCall[] = []
  for (const p of message.parts) {
    if (!isSubToolCallPart(p)) continue
    if (p.data.codeToolCallId !== id) continue
    collected.push(p.data)
  }
  return collected
})

const SUBTOOL_LABEL: Record<string, string> = {
  list_blog_posts: 'list blog posts',
  get_blog_post: 'get blog post',
  list_notes: 'list notes',
  get_note: 'get note',
  list_tils: 'list TILs',
  get_til: 'get TIL'
}

function labelFor(name: string): string {
  return SUBTOOL_LABEL[name] ?? name
}

const highlightedHtml = ref<string>('')
const showCode = ref(true)
const showResult = ref(false)

watchEffect(async () => {
  if (!import.meta.client || !code.value || part.state === 'input-streaming') {
    highlightedHtml.value = ''
    return
  }
  try {
    const { codeToHtml } = await import('shiki')
    highlightedHtml.value = await codeToHtml(code.value, {
      lang: 'typescript',
      theme: colorMode.value === 'dark' ? 'github-dark' : 'github-light'
    })
  } catch {
    highlightedHtml.value = ''
  }
})
</script>

<template>
  <div class="my-2 rounded-lg border border-default overflow-hidden bg-elevated/40">
    <div class="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-default bg-elevated">
      <UIcon name="i-lucide-braces" class="text-primary" />
      <span class="font-medium">Code Mode</span>
      <span class="text-muted">·</span>
      <span :class="meta.color">{{ meta.label }}</span>
      <button
        type="button"
        class="ml-auto text-muted hover:text-default"
        @click="showCode = !showCode"
      >
        {{ showCode ? 'Hide' : 'Show' }} code
      </button>
    </div>
    <template v-if="showCode && code">
      <!-- eslint-disable vue/no-v-html -- trusted Shiki output from plain code input -->
      <div
        v-if="highlightedHtml"
        class="text-xs overflow-x-auto chat-code-block"
        v-html="highlightedHtml"
      />
      <!-- eslint-enable vue/no-v-html -->
      <pre v-else class="px-3 py-3 text-xs overflow-x-auto whitespace-pre-wrap">{{ code }}</pre>
    </template>
    <div v-if="subToolCalls.length" class="px-3 py-2 border-t border-default flex flex-wrap gap-1.5">
      <TransitionGroup
        :enter-active-class="'transition-opacity duration-200'"
        :enter-from-class="'opacity-0'"
        :enter-to-class="'opacity-100'"
      >
        <span
          v-for="call in subToolCalls"
          :key="call.seq"
          class="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded ring ring-default bg-elevated/60"
          :title="call.resultSummary"
        >
          <UIcon
            :name="call.endedAt ? 'i-lucide-check' : 'i-lucide-loader'"
            :class="call.endedAt ? 'size-3 text-success' : 'size-3 text-muted animate-spin'"
          />
          <span class="text-default">{{ labelFor(call.name) }}</span>
          <span v-if="call.endedAt" class="text-muted tabular-nums">{{ call.endedAt - call.startedAt }}ms</span>
        </span>
      </TransitionGroup>
    </div>
    <div v-if="output" class="border-t border-default">
      <button
        type="button"
        class="flex items-center gap-1 w-full px-3 py-1.5 text-xs text-muted hover:text-default"
        @click="showResult = !showResult"
      >
        <UIcon :name="showResult ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" />
        Result
      </button>
      <pre v-if="showResult" class="px-3 pb-3 text-[11px] whitespace-pre-wrap break-all overflow-x-auto">{{ output }}</pre>
    </div>
  </div>
</template>

<style scoped>
.chat-code-block :deep(pre) {
  margin: 0;
  padding: 0.75rem 1rem;
  background: transparent !important;
  font-size: 12px;
  line-height: 1.5;
}
.chat-code-block :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
