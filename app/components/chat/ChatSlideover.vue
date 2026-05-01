<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { AGENT_METRICS_KEY, type AgentMode } from '~~/shared/agent'

const open = useChatSlideover()
const route = useRoute()

const stored = useSessionStorage<UIMessage[]>('agent-messages', [])
const useContext = useLocalStorage('agent-use-context', true)
const mode = useLocalStorage<AgentMode>('agent-mode', 'classical')
const chatId = useLocalStorage('agent-chat-id', () => crypto.randomUUID())

const CONTEXT_PREFIXES = ['/blog/', '/notes/', '/til/']
const currentPage = computed(() =>
  CONTEXT_PREFIXES.some(p => route.path.startsWith(p)) ? route.path : null
)

const modeItems: { label: string, value: AgentMode }[] = [
  { label: 'Classical', value: 'classical' },
  { label: 'Code Mode', value: 'code' }
]

function buildChat() {
  return new Chat({
    id: chatId.value,
    messages: stored.value,
    transport: new DefaultChatTransport({
      api: '/api/agent',
      body: (): Record<string, AgentMode> => ({ mode: mode.value }),
      headers: (): Record<string, string> =>
        useContext.value && currentPage.value
          ? { 'x-page-path': currentPage.value }
          : {}
    }),
    onFinish: () => {
      stored.value = [...chat.value.messages]
      refreshNuxtData(AGENT_METRICS_KEY)
    }
  })
}

const chat = shallowRef(buildChat())

watch(mode, () => {
  chat.value.stop()
  chatId.value = crypto.randomUUID()
  stored.value = []
  chat.value = buildChat()
})

const input = ref('')
async function send() {
  if (!input.value.trim()) return
  const text = input.value
  input.value = ''
  await chat.value.sendMessage({ text })
}
</script>

<template>
  <USlideover v-model:open="open" title="Ask my blog" :ui="{ content: 'max-w-xl' }">
    <template #body>
      <div class="flex flex-col h-full">
        <div class="px-3 py-2 border-b border-default flex flex-col gap-2">
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs font-medium text-muted">Agent mode</span>
            <UTabs
              v-model="mode"
              :items="modeItems"
              :content="false"
              size="xs"
              variant="pill"
            />
          </div>
          <p class="text-[11px] text-muted leading-snug">
            <template v-if="mode === 'classical'">
              One MCP tool call per step — classical fan-out.
            </template>
            <template v-else>
              LLM writes JS that orchestrates tools in a V8 sandbox — one round-trip.
            </template>
          </p>
          <ChatMetricsCompare />
        </div>
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
