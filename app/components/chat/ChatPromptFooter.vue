<script setup lang="ts">
import type { ChatStatus } from 'ai'

const { status, quota } = defineProps<{
  status: ChatStatus
  quota: { remaining: number, limit: number } | null
}>()

defineEmits<{
  stop: []
}>()
</script>

<template>
  <UTooltip v-if="quota" text="Daily messages remaining">
    <span
      class="text-xs"
      :class="quota.remaining <= 5 ? 'text-warning' : 'text-dimmed'"
    >
      {{ quota.remaining }}/{{ quota.limit }}
    </span>
  </UTooltip>
  <UChatPromptSubmit :status="status" @stop="$emit('stop')" />
</template>
