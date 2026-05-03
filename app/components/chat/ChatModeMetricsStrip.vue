<script setup lang="ts">
import { AGENT_METRICS_KEY, emptyAggregate, type AgentMode, type ModeAggregate } from '~~/shared/agent'

type MetricsResponse = { classical: ModeAggregate, code: ModeAggregate }

const { data } = await useFetch<MetricsResponse>('/api/agent/metrics', {
  key: AGENT_METRICS_KEY,
  default: (): MetricsResponse => ({ classical: emptyAggregate('classical'), code: emptyAggregate('code') })
})

function fmtSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

function fmtCost(dollars: number): string {
  return `$${dollars.toFixed(4)}`
}

function summarize(mode: AgentMode, agg: ModeAggregate): string | null {
  if (!agg.requests) return null
  const latency = fmtSeconds(agg.durationMs / agg.requests)
  const cost = fmtCost(agg.estimatedCost / agg.requests)
  const label = mode === 'classical' ? 'Classical' : 'Code'
  return `${label} · ${latency} · ${cost}`
}

const summary = computed(() => {
  const parts = [
    summarize('classical', data.value.classical),
    summarize('code', data.value.code)
  ].filter((s): s is string => s !== null)
  return parts.length ? parts.join('  •  ') : null
})
</script>

<template>
  <p v-if="summary" class="text-xs text-muted tabular-nums">
    {{ summary }}
  </p>
</template>
