<script setup lang="ts">
const { rows = 2, maxrows = 8, onSubmit } = defineProps<{
  rows?: number
  maxrows?: number
  onSubmit?: () => void | Promise<void>
}>()

const store = useAgentChatStore()
const { input, composerStatus, quota, rateLimited, sendDisabled, viewMode, bothAvailable } = storeToRefs(store)
const { send, stop } = store

const handleSubmit = async () => {
  if (onSubmit) {
    await onSubmit()
    return
  }
  await send()
}

const disabledHint = computed(() => {
  if (viewMode.value === 'both' && !bothAvailable.value) {
    return 'Both uses 2 messages per send — switch to single mode to use your last.'
  }
  return null
})
</script>

<template>
  <div v-if="rateLimited" class="px-4 py-3 flex items-center justify-center gap-2 text-xs text-muted">
    <UIcon name="i-lucide-clock" class="size-3.5 shrink-0" />
    Daily limit reached. Try again tomorrow.
  </div>
  <template v-else>
    <p v-if="disabledHint" class="px-4 pt-2 pb-1 text-[11px] text-muted text-center">
      {{ disabledHint }}
    </p>
    <UChatPrompt
      v-model="input"
      placeholder="Ask anything…"
      variant="subtle"
      :rows="rows"
      :maxrows="maxrows"
      :disabled="sendDisabled"
      autofocus
      @submit="handleSubmit"
    >
      <template #footer>
        <ChatPromptFooter :status="composerStatus" :quota="quota" @stop="stop" />
      </template>
    </UChatPrompt>
  </template>
</template>
