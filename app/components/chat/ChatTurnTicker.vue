<script setup lang="ts">
import type { UIMessage } from 'ai'
import { readLatestTurnMetrics } from '~~/shared/agent-telemetry'

const { message, streaming = false } = defineProps<{
  message: UIMessage
  streaming?: boolean
}>()

const metrics = computed(() => readLatestTurnMetrics(message))

// Wall-clock fallback while streaming and no metrics yet.
const wallStart = ref<number | null>(null)
const wallNow = ref<number>(Date.now())
let timerId: ReturnType<typeof setInterval> | null = null

function startTimer(): void {
  if (timerId !== null) return
  wallStart.value = Date.now()
  wallNow.value = wallStart.value
  timerId = setInterval(() => {
    wallNow.value = Date.now()
  }, 200)
}

function stopTimer(): void {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

watchEffect(() => {
  const needTimer = streaming && metrics.value === null
  if (needTimer) {
    startTimer()
    return
  }
  stopTimer()
})

onBeforeUnmount(stopTimer)

const elapsedMs = computed<number>(() => {
  if (metrics.value) return metrics.value.elapsedMs
  if (wallStart.value !== null) return wallNow.value - wallStart.value
  return 0
})

function fmtSeconds(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
</script>

<template>
  <div
    v-if="metrics || streaming"
    class="inline-flex items-center gap-2 text-[11px] text-muted tabular-nums"
    :aria-label="streaming && !metrics ? 'Turn in progress' : 'Turn metrics'"
  >
    <span class="inline-flex items-center gap-1">
      <UIcon name="i-lucide-timer" class="size-3" />
      {{ fmtSeconds(elapsedMs) }}
    </span>
    <span class="inline-flex items-center gap-1">
      <UIcon name="i-lucide-repeat-2" class="size-3" />
      {{ metrics?.steps ?? 0 }} {{ (metrics?.steps ?? 0) === 1 ? 'trip' : 'trips' }}
    </span>
    <span class="inline-flex items-center gap-1">
      <UIcon name="i-lucide-wrench" class="size-3" />
      {{ metrics?.tools ?? 0 }} {{ (metrics?.tools ?? 0) === 1 ? 'tool' : 'tools' }}
    </span>
  </div>
</template>
