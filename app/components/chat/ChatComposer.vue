<script setup lang="ts">
const { rows = 2, maxrows = 8 } = defineProps<{ rows?: number, maxrows?: number }>()

const store = useAgentChatStore()
const { input, status, quota, rateLimited } = storeToRefs(store)
const { send } = store
</script>

<template>
  <div v-if="rateLimited" class="px-4 py-3 flex items-center justify-center gap-2 text-xs text-muted">
    <UIcon name="i-lucide-clock" class="size-3.5 shrink-0" />
    Daily limit reached. Try again tomorrow.
  </div>
  <UChatPrompt
    v-else
    v-model="input"
    placeholder="Ask anything…"
    variant="subtle"
    :rows="rows"
    :maxrows="maxrows"
    autofocus
    @submit="send"
  >
    <template #footer>
      <ChatPromptFooter :status="status" :quota="quota" />
    </template>
  </UChatPrompt>
</template>
