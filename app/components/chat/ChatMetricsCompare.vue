<script setup lang="ts">
import { AGENT_METRICS_KEY, emptyAggregate, type ModeAggregate } from '~~/shared/agent'

type MetricsResponse = { classical: ModeAggregate, code: ModeAggregate }

const { data } = await useFetch<MetricsResponse>(
  '/api/agent/metrics',
  {
    key: AGENT_METRICS_KEY,
    default: (): MetricsResponse => ({ classical: emptyAggregate('classical'), code: emptyAggregate('code') })
  }
)

function perMessage(agg: ModeAggregate) {
  if (!agg.requests) {
    return { tokens: '–', cost: '–', durationMs: '–' }
  }
  const tokens = Math.round((agg.inputTokens + agg.outputTokens) / agg.requests)
  const cost = (agg.estimatedCost / agg.requests).toFixed(4)
  const durationMs = Math.round(agg.durationMs / agg.requests)
  return { tokens: tokens.toLocaleString(), cost: `$${cost}`, durationMs: `${durationMs.toLocaleString()}ms` }
}

const cards = computed(() =>
  (['classical', 'code'] as const).map((mode) => {
    const aggregate = data.value[mode]
    const stats = perMessage(aggregate)
    return {
      mode,
      label: mode === 'classical' ? 'Classical' : 'Code Mode',
      requests: aggregate.requests,
      rows: [
        { label: 'tokens/msg', value: stats.tokens },
        { label: 'cost/msg', value: stats.cost },
        { label: 'latency', value: stats.durationMs }
      ]
    }
  })
)

const hasData = computed(() => data.value.classical.requests + data.value.code.requests > 0)
</script>

<template>
  <div v-if="hasData" class="grid grid-cols-2 gap-2 text-[11px]">
    <div v-for="card in cards" :key="card.mode" class="rounded border border-default p-2">
      <div class="font-medium mb-1 flex justify-between">
        <span>{{ card.label }}</span>
        <span class="text-muted">{{ card.requests }} msg</span>
      </div>
      <dl class="space-y-0.5 text-muted">
        <div v-for="row in card.rows" :key="row.label" class="flex justify-between">
          <dt>{{ row.label }}</dt>
          <dd class="tabular-nums">
            {{ row.value }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
