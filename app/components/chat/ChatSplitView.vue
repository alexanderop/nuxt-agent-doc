<script setup lang="ts">
import type { UIMessage } from 'ai'

const store = useAgentChatStore()
const {
  messagesClassical,
  messagesCode,
  statusClassical,
  statusCode
} = storeToRefs(store)

function lastAssistant(messages: UIMessage[]): UIMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m && m.role === 'assistant') return m
  }
  return null
}

const lastClassical = computed(() => lastAssistant(messagesClassical.value))
const lastCode = computed(() => lastAssistant(messagesCode.value))

const eitherStreaming = computed(() =>
  statusClassical.value === 'streaming' || statusCode.value === 'streaming'
)

const columns = computed(() => [
  {
    key: 'classical' as const,
    title: 'Classical',
    description: 'One MCP tool call per step',
    messages: messagesClassical.value,
    status: statusClassical.value,
    last: lastClassical.value
  },
  {
    key: 'code' as const,
    title: 'Code',
    description: 'JS body batches tool calls',
    messages: messagesCode.value,
    status: statusCode.value,
    last: lastCode.value
  }
])
</script>

<template>
  <div class="flex flex-col h-full min-h-0 gap-2">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0">
      <section
        v-for="col in columns"
        :key="col.key"
        class="flex flex-col min-h-0 rounded-md ring ring-default bg-elevated/30 overflow-hidden"
        :aria-label="`${col.title} mode column`"
      >
        <header class="px-3 py-1.5 border-b border-default flex items-center justify-between gap-2 bg-elevated/40">
          <div class="flex items-baseline gap-2 min-w-0">
            <span class="text-sm font-semibold text-highlighted">{{ col.title }}</span>
            <span class="text-[11px] text-muted truncate hidden sm:inline">{{ col.description }}</span>
          </div>
          <ChatTurnTicker
            v-if="col.last"
            :message="col.last"
            :streaming="col.status === 'streaming'"
          />
        </header>

        <div class="flex-1 min-h-0 overflow-y-auto overscroll-none px-3">
          <UChatMessages
            should-auto-scroll
            :messages="col.messages"
            :status="col.status"
          >
            <template #content="{ message }">
              <ChatContent :message="message" />
              <ChatTurnTicker
                v-if="message.role === 'assistant'"
                :message="message"
                :streaming="col.status === 'streaming' && col.last?.id === message.id"
              />
            </template>
            <template #actions="{ message }">
              <ChatMessageActions
                v-if="message.role === 'assistant'"
                :message="message"
              />
            </template>
          </UChatMessages>
        </div>
      </section>
    </div>

    <div v-if="!eitherStreaming" class="flex justify-center">
      <ChatTurnDeltaStrip
        :classical-message="lastClassical"
        :code-message="lastCode"
      />
    </div>
  </div>
</template>
