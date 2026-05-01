<script setup lang="ts">
type Suggestion = { icon: string, title: string, description: string, question: string }

const { suggestions } = defineProps<{ suggestions: Suggestion[] }>()
defineEmits<{ ask: [question: string] }>()
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center gap-8 px-4 sm:px-6 py-8">
    <div class="text-center max-w-lg">
      <UIcon name="i-lucide-sparkles" class="size-8 text-primary mb-3" />
      <h1 class="text-2xl sm:text-3xl font-semibold text-highlighted tracking-tight">
        Ask my blog
      </h1>
      <p class="text-sm text-muted mt-2">
        Search posts, notes, and TILs — or ask me to summarize anything Alex has written.
      </p>
    </div>
    <div class="w-full max-w-xl">
      <ChatSuggestions :suggestions="suggestions" @ask="(q: string) => $emit('ask', q)" />
    </div>
  </div>
</template>
