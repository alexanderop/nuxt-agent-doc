import { Chat } from '@ai-sdk/vue'
import { defineStore } from 'pinia'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useLocalStorage, useSessionStorage } from '@vueuse/core'
import { AGENT_METRICS_KEY, type AgentMode } from '~~/shared/agent'

export type FaqCategory = { category: string, items: string[] }

export const FAQ_QUESTIONS: FaqCategory[] = [
  {
    category: 'Latest content',
    items: [
      'What is your most recent blog post about?',
      'What is the most recent TIL?',
      'Recommend one of Alex\'s notes that is worth reading.'
    ]
  },
  {
    category: 'Topics',
    items: [
      'Find Alex\'s post about Vue testing and summarize it.',
      'Find recent posts about how Alex uses AI agents.',
      'List the blog posts tagged with Nuxt.'
    ]
  },
  {
    category: 'About Alex',
    items: [
      'What does Alex write about most often?',
      'What\'s Alex\'s tech stack?',
      'How is this blog built?'
    ]
  }
]

const CONTEXT_PREFIXES = ['/blog/', '/notes/', '/til/']

type AgentQuota = { remaining: number, limit: number, used: number } | null

export const useAgentChatStore = defineStore('agentChat', () => {
  const route = useRoute()
  const router = useRouter()

  const currentPage = computed(() =>
    CONTEXT_PREFIXES.some(p => route.path.startsWith(p)) ? route.path : null
  )

  const stored = useSessionStorage<UIMessage[]>('agent-messages', [])
  const chatId = useLocalStorage('agent-chat-id', () => crypto.randomUUID())
  const mode = useLocalStorage<AgentMode>('agent-mode', 'classical')
  const useCtx = useLocalStorage('agent-use-context', true)
  const isOpen = ref(false)
  const input = ref('')

  const chat = new Chat({
    id: chatId.value,
    messages: stored.value,
    transport: new DefaultChatTransport({
      api: '/api/agent',
      body: () => ({ id: chatId.value, mode: mode.value }),
      headers: (): Record<string, string> =>
        useCtx.value && currentPage.value
          ? { 'x-page-path': currentPage.value }
          : {}
    }),
    onFinish: () => {
      stored.value = chat.messages
      refreshNuxtData(AGENT_METRICS_KEY)
      refreshNuxtData('agent-quota')
    }
  })

  const { data: quota } = useFetch<AgentQuota>('/api/agent/quota', {
    key: 'agent-quota',
    server: false,
    lazy: true,
    default: () => null
  })

  const messages = computed(() => chat.messages)
  const status = computed(() => chat.status)
  const isStreaming = computed(() => chat.status === 'streaming')
  const canClear = computed(() => chat.messages.length > 0)
  const rateLimited = computed(() => (quota.value?.remaining ?? 1) <= 0)
  const currentMode = computed(() => mode.value)
  const useContext = computed(() => useCtx.value)

  function stop(): void {
    if (chat.status === 'streaming') chat.stop()
  }

  function clear(): void {
    stop()
    chatId.value = crypto.randomUUID()
    chat.messages.splice(0)
    stored.value = []
  }

  function switchMode(next: AgentMode): void {
    if (mode.value === next) return
    stop()
    mode.value = next
    clear()
  }

  function toggleContext(): void {
    useCtx.value = !useCtx.value
  }

  async function send(): Promise<void> {
    if (!input.value.trim()) return
    const text = input.value
    input.value = ''
    await chat.sendMessage({ text })
  }

  async function ask(question: string): Promise<void> {
    await chat.sendMessage({ text: question })
  }

  async function expandToFullScreen(): Promise<void> {
    isOpen.value = false
    await router.push('/chat')
  }

  async function collapseToSidebar(): Promise<void> {
    await router.push('/')
    isOpen.value = true
  }

  return {
    messages,
    status,
    isStreaming,
    canClear,
    rateLimited,
    quota,
    currentPage,
    isOpen,
    input,
    mode: currentMode,
    useContext,
    faqQuestions: FAQ_QUESTIONS,
    send,
    ask,
    stop,
    clear,
    switchMode,
    toggleContext,
    expandToFullScreen,
    collapseToSidebar
  }
})
