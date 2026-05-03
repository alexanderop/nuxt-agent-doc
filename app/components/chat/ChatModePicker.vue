<script setup lang="ts">
import type { ViewMode } from '~~/shared/agent'

const { size } = defineProps<{ size: 'hero' | 'compact-header' | 'compact-slideover' }>()

const store = useAgentChatStore()
const { viewMode, bothAvailable, statusClassical, statusCode } = storeToRefs(store)
const { switchMode } = store

const pills: { value: ViewMode, label: string }[] = [
  { value: 'classical', label: 'Classical' },
  { value: 'code', label: 'Code' },
  { value: 'both', label: 'Both' }
]

function isBackgroundStreaming(value: ViewMode): boolean {
  if (value === viewMode.value) return false
  if (value === 'classical') return statusClassical.value === 'streaming'
  if (value === 'code') return statusCode.value === 'streaming'
  return statusClassical.value === 'streaming' || statusCode.value === 'streaming'
}

function isDisabled(value: ViewMode): boolean {
  return value === 'both' && !bothAvailable.value
}

function disabledHint(value: ViewMode): string | undefined {
  if (!isDisabled(value)) return undefined
  return 'Both uses 2 messages per send — switch to single mode to use your last.'
}

function onPick(value: ViewMode): void {
  if (isDisabled(value)) return
  switchMode(value)
}

const CONTAINER_CLASS: Record<typeof size, string> = {
  'hero': 'inline-flex items-center gap-1 p-1 rounded-full bg-elevated/60 ring ring-default',
  'compact-header': 'inline-flex items-center gap-0.5 p-0.5 rounded-full bg-elevated/60 ring ring-default',
  'compact-slideover': 'inline-flex items-center gap-0.5 p-0.5 rounded-full bg-elevated/60 ring ring-default'
}

const PILL_CLASS: Record<typeof size, string> = {
  'hero': 'px-4 py-1.5 text-sm font-medium',
  'compact-header': 'px-2.5 py-1 text-xs font-medium',
  'compact-slideover': 'px-2.5 py-1 text-xs font-medium'
}

const containerClass = computed(() => CONTAINER_CLASS[size])
const pillClass = computed(() => PILL_CLASS[size])
</script>

<template>
  <div :class="containerClass" role="tablist" aria-label="Agent mode">
    <UTooltip
      v-for="pill in pills"
      :key="pill.value"
      :text="disabledHint(pill.value)"
      :disabled="!disabledHint(pill.value)"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="viewMode === pill.value"
        :aria-label="`${pill.label} mode${pill.value === 'both' ? ' (uses 2 messages per send)' : ''}`"
        :disabled="isDisabled(pill.value)"
        :class="[
          'relative inline-flex items-center gap-1.5 rounded-full transition-colors cursor-pointer',
          pillClass,
          viewMode === pill.value
            ? 'bg-default text-highlighted shadow-sm'
            : 'text-muted hover:text-default',
          isDisabled(pill.value) && 'opacity-50 cursor-not-allowed hover:text-muted'
        ]"
        @click="onPick(pill.value)"
      >
        <span>{{ pill.label }}</span>
        <span
          v-if="pill.value === 'both'"
          class="text-[10px] tabular-nums px-1 rounded bg-primary/15 text-primary"
        >×2</span>
        <span
          v-if="isBackgroundStreaming(pill.value)"
          aria-hidden="true"
          class="size-1.5 rounded-full bg-primary animate-pulse"
        />
      </button>
    </UTooltip>
  </div>
</template>
