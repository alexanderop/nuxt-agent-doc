<script setup lang="ts">
import type { UIMessage } from 'ai'

const store = useAgentChatStore()
const { messages, status } = storeToRefs(store)

const latestAssistantId = computed<string | null>(() => {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    const m = messages.value[i]
    if (m && m.role === 'assistant') return m.id
  }
  return null
})

function isStreamingMessage(message: UIMessage): boolean {
  return status.value === 'streaming' && message.id === latestAssistantId.value
}
</script>

<template>
  <UChatMessages
    should-auto-scroll
    :messages="messages"
    :status="status"
  >
    <template #content="{ message }">
      <ChatContent :message="message" />
      <ChatTurnTicker
        v-if="message.role === 'assistant'"
        :message="message"
        :streaming="isStreamingMessage(message)"
      />
    </template>
    <template #actions="{ message }">
      <ChatMessageActions
        v-if="message.role === 'assistant'"
        :message="message"
      />
    </template>
  </UChatMessages>
</template>
