<script setup lang="ts">
type Suggestion = { icon: string, title: string, description: string, question: string }

const { suggestions } = defineProps<{ suggestions: Suggestion[] }>()
defineEmits<{ ask: [question: string] }>()
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
    <button
      v-for="s in suggestions"
      :key="s.title"
      type="button"
      class="flex items-start gap-3 p-3 rounded-lg border border-default bg-default hover:bg-elevated/50 text-left transition-colors cursor-pointer"
      @click="$emit('ask', s.question)"
    >
      <UIcon :name="s.icon" class="size-4 text-muted shrink-0 mt-0.5" />
      <div class="min-w-0">
        <p class="text-sm font-medium text-highlighted truncate">
          {{ s.title }}
        </p>
        <p class="text-xs text-muted mt-0.5 truncate">
          {{ s.description }}
        </p>
      </div>
    </button>
  </div>
</template>
