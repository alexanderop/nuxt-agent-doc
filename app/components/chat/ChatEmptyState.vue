<script setup lang="ts">
import type { FaqCategory } from '~/stores/useAgentChat'

const { faqQuestions } = defineProps<{ faqQuestions: FaqCategory[] }>()
defineEmits<{ ask: [question: string] }>()
</script>

<template>
  <div class="flex flex-col px-4 sm:px-4 pb-4">
    <div class="flex flex-col gap-6 mt-6">
      <UPageLinks
        v-for="category in faqQuestions"
        :key="category.category"
        :title="category.category"
        :links="category.items.map(item => ({ label: item, onClick: () => $emit('ask', item) }))"
      />
    </div>
  </div>
</template>
