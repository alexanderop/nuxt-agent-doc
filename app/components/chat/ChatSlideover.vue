<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport, type UIMessage } from 'ai'

const open = useChatSlideover()
const route = useRoute()

const stored = useSessionStorage<UIMessage[]>('agent-messages', [])
const useContext = useLocalStorage('agent-use-context', true)

const CONTEXT_PREFIXES = ['/blog/', '/notes/', '/til/']
const currentPage = computed(() =>
  CONTEXT_PREFIXES.some(p => route.path.startsWith(p)) ? route.path : null
)

const chat = new Chat({
  messages: stored.value,
  transport: new DefaultChatTransport({
    api: '/api/agent',
    headers: (): Record<string, string> =>
      useContext.value && currentPage.value
        ? { 'x-page-path': currentPage.value }
        : {}
  }),
  onFinish: () => {
    stored.value = [...chat.messages]
  }
})

const input = ref('')
async function send() {
  if (!input.value.trim()) return
  const text = input.value
  input.value = ''
  await chat.sendMessage({ text })
}
</script>

<template>
  <USlideover v-model:open="open" title="Ask my blog" :ui="{ content: 'max-w-xl' }">
    <template #body>
      <div class="flex flex-col h-full">
        <div v-if="currentPage" class="px-3 py-2 text-xs border-b border-default">
          <UCheckbox v-model="useContext" :label="`Using context: ${currentPage}`" />
        </div>
        <UChatMessages
          :messages="chat.messages"
          :status="chat.status"
          class="flex-1 overflow-y-auto px-3"
        >
          <template #content="{ message }">
            <ChatContent :message="message" />
          </template>
        </UChatMessages>
        <UChatPrompt
          v-model="input"
          placeholder="Ask anything…"
          class="border-t border-default"
          @submit="send"
        >
          <UChatPromptSubmit :status="chat.status" />
        </UChatPrompt>
      </div>
    </template>
  </USlideover>
</template>
