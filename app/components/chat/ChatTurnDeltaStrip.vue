<script setup lang="ts">
import type { UIMessage } from 'ai'
import { readLatestTurnMetrics } from '~~/shared/agent-telemetry'

const { classicalMessage, codeMessage } = defineProps<{
  classicalMessage: UIMessage | null
  codeMessage: UIMessage | null
}>()

const classical = computed(() => readLatestTurnMetrics(classicalMessage))
const code = computed(() => readLatestTurnMetrics(codeMessage))

const visible = computed(() => classical.value !== null && code.value !== null)

type DeltaItem = { label: string, value: string, tone: 'success' | 'muted' | 'default' }

function signOf(n: number): string {
  if (n > 0) return '+'
  if (n < 0) return '−'
  return ''
}

function fmtSecondsDelta(ms: number): string {
  const sign = signOf(ms)
  const abs = Math.abs(ms)
  if (abs < 1000) return `${sign}${abs}ms`
  return `${sign}${(abs / 1000).toFixed(1)}s`
}

function fmtIntDelta(n: number): string {
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`
}

function fmtCostDelta(dollars: number): string {
  if (dollars === 0) return '$0'
  const sign = dollars > 0 ? '+' : '−'
  return `${sign}$${Math.abs(dollars).toFixed(4)}`
}

function tone(delta: number): DeltaItem['tone'] {
  if (delta < 0) return 'success'
  if (delta > 0) return 'default'
  return 'muted'
}

const items = computed<DeltaItem[]>(() => {
  const c = classical.value
  const k = code.value
  if (!c || !k) return []

  const list: DeltaItem[] = []

  const dTime = k.elapsedMs - c.elapsedMs
  list.push({ label: 'time', value: dTime === 0 ? 'same' : fmtSecondsDelta(dTime), tone: tone(dTime) })

  const dTrips = k.steps - c.steps
  list.push({ label: 'trips', value: dTrips === 0 ? 'same trips' : `${fmtIntDelta(dTrips)} trips`, tone: tone(dTrips) })

  const dTools = k.tools - c.tools
  list.push({ label: 'tools', value: dTools === 0 ? 'same tools' : `${fmtIntDelta(dTools)} tools`, tone: tone(dTools) })

  if (c.estimatedCost > 0 || k.estimatedCost > 0) {
    const dCost = k.estimatedCost - c.estimatedCost
    list.push({ label: 'cost', value: dCost === 0 ? 'same cost' : fmtCostDelta(dCost), tone: tone(dCost) })
  }

  return list
})

const toneClass = {
  success: 'text-success',
  default: 'text-default',
  muted: 'text-muted'
} as const
</script>

<template>
  <div
    v-if="visible"
    class="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tabular-nums px-3 py-1.5 rounded-md bg-elevated/40 ring ring-default"
    aria-label="Code mode delta vs Classical"
  >
    <span class="text-muted">Δ code vs classical:</span>
    <span
      v-for="item in items"
      :key="item.label"
      :class="toneClass[item.tone]"
    >
      {{ item.value }}
    </span>
  </div>
</template>
