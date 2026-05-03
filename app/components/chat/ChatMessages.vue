<script setup lang="ts">
const store = useAgentChatStore()
const { messages, status } = storeToRefs(store)
</script>

<template>
  <UChatMessages
    should-auto-scroll
    :messages="messages"
    :status="status"
  >
    <template #content="{ message }">
      <ChatContent :message="message" />
    </template>
    <template #actions="{ message }">
      <ChatMessageActions
        v-if="message.role === 'assistant'"
        :message="message"
      />
    </template>
  </UChatMessages>
</template>
