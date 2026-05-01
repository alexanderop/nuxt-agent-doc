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
const fullscreen = useLocalStorage('agent-fullscreen', false)
const showDetails = ref(false)

const CONTEXT_PREFIXES = ['/blog/', '/notes/', '/til/']
const currentPage = computed(() =>
  CONTEXT_PREFIXES.some(p => route.path.startsWith(p)) ? route.path : null
)

const modeItems: { label: string, value: AgentMode }[] = [
  { label: 'Classical', value: 'classical' },
  { label: 'Code Mode', value: 'code' }
]

const suggestions = [
  { icon: 'i-lucide-newspaper', title: 'Latest blog post', description: 'Most recent post', question: 'What is your most recent blog post about?' },
  { icon: 'i-lucide-flask-conical', title: 'Vue testing', description: 'Find a testing post', question: 'Find Alex\'s post about Vue testing and summarize it.' },
  { icon: 'i-lucide-sparkles', title: 'AI workflow', description: 'How Alex uses AI', question: 'Find recent posts about how Alex uses AI agents.' },
  { icon: 'i-lucide-lightbulb', title: 'Latest TIL', description: 'A recent thing learned', question: 'What is the most recent TIL?' },
  { icon: 'i-lucide-sticky-note', title: 'Pick a note', description: 'Recommend a note', question: 'Recommend one of Alex\'s notes that is worth reading.' },
  { icon: 'i-lucide-tags', title: 'Posts about Nuxt', description: 'Browse Nuxt content', question: 'List the blog posts tagged with Nuxt.' }
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
      refreshNuxtData('agent-quota')
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
async function ask(question: string) {
  await chat.value.sendMessage({ text: question })
}

const { data: quota } = useFetch('/api/agent/quota', { key: 'agent-quota', default: () => null, lazy: true })
const rateLimited = computed(() => (quota.value?.remaining ?? 1) <= 0)

const slideTransition = {
  'enter-active-class': 'transition-all duration-150',
  'leave-active-class': 'transition-all duration-150',
  'enter-from-class': 'opacity-0 -translate-y-1',
  'leave-to-class': 'opacity-0 -translate-y-1'
}

const canClear = computed(() => chat.value.messages.length > 0)
function clearChat() {
  chat.value.stop()
  chatId.value = crypto.randomUUID()
  stored.value = []
  chat.value = buildChat()
}

defineShortcuts({
  tab: {
    handler: () => {
      if (currentPage.value) useContext.value = !useContext.value
    }
  }
})
</script>

<template>
  <USlideover v-model:open="open" title="Ask my blog" :ui="{ content: fullscreen ? 'sm:max-w-none w-screen' : 'sm:max-w-2xl' }">
    <template #actions>
      <UTooltip text="Toggle agent details">
        <UButton
          icon="i-lucide-sliders-horizontal"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Toggle agent details"
          :class="showDetails ? 'text-primary' : ''"
          @click="showDetails = !showDetails"
        />
      </UTooltip>
      <UTooltip v-if="canClear" text="New conversation">
        <UButton
          icon="i-lucide-list-x"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Clear conversation"
          @click="clearChat"
        />
      </UTooltip>
      <UTooltip :text="fullscreen ? 'Exit full screen' : 'Full screen'">
        <UButton
          :icon="fullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="fullscreen ? 'Exit full screen' : 'Full screen'"
          @click="fullscreen = !fullscreen"
        />
      </UTooltip>
    </template>

    <template #body>
      <div class="flex flex-col h-full">
        <Transition v-bind="slideTransition">
          <div v-if="showDetails" class="px-4 py-3 border-b border-default flex flex-col gap-2 bg-elevated/30">
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
        </Transition>

        <Transition v-bind="slideTransition">
          <div
            v-if="currentPage && useContext"
            class="px-4 py-2 border-b border-default flex items-center gap-2"
          >
            <UIcon name="i-lucide-link" class="size-3.5 text-muted shrink-0" />
            <span class="text-xs text-muted truncate flex-1">
              Using context: <span class="text-default">{{ currentPage }}</span>
            </span>
            <UKbd value="Tab" size="sm" />
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Stop using page context"
              @click="useContext = false"
            />
          </div>
        </Transition>

        <ChatEmptyState
          v-if="!chat.messages.length"
          :suggestions="suggestions"
          @ask="ask"
        />

        <div v-else class="flex-1 overflow-y-auto overscroll-none">
          <div class="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <UChatMessages
              should-auto-scroll
              :messages="chat.messages"
              :status="chat.status"
              class="pt-4 pb-4"
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
          </div>
        </div>

        <div class="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <div v-if="rateLimited" class="border-t border-default px-3 py-3 flex items-center justify-center gap-2 text-xs text-muted">
            <UIcon name="i-lucide-clock" class="size-3.5 shrink-0" />
            Daily limit reached. Try again tomorrow.
          </div>
          <UChatPrompt
            v-else
            v-model="input"
            placeholder="Ask anything…"
            variant="subtle"
            :rows="2"
            :maxrows="8"
            autofocus
            @submit="send"
          >
            <template #footer>
              <ChatPromptFooter :status="chat.status" :quota="quota" />
            </template>
          </UChatPrompt>
        </div>
      </div>
    </template>
  </USlideover>
</template>
