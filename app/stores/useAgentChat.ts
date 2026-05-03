import { Chat } from '@ai-sdk/vue'
import { defineStore } from 'pinia'
import { DefaultChatTransport, type ChatStatus, type UIMessage } from 'ai'
import { useLocalStorage, useSessionStorage } from '@vueuse/core'
import { AGENT_METRICS_KEY, type AgentMode, type ViewMode } from '~~/shared/agent'

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

  const storedClassical = useSessionStorage<UIMessage[]>(`agent-messages-classical`, [])
  const storedCode = useSessionStorage<UIMessage[]>(`agent-messages-code`, [])
  const chatIdClassical = useLocalStorage('agent-chat-id-classical', () => crypto.randomUUID())
  const chatIdCode = useLocalStorage('agent-chat-id-code', () => crypto.randomUUID())
  const viewMode = useLocalStorage<ViewMode>('agent-mode', 'both')
  const useCtx = useLocalStorage('agent-use-context', true)
  const isOpen = ref(false)
  const input = ref('')

  function buildHeaders(): Record<string, string> {
    return useCtx.value && currentPage.value
      ? { 'x-page-path': currentPage.value }
      : {}
  }

  function refreshSharedQueries(): void {
    refreshNuxtData(AGENT_METRICS_KEY)
    refreshNuxtData('agent-quota')
  }

  const chatClassical = new Chat({
    id: chatIdClassical.value,
    messages: storedClassical.value,
    transport: new DefaultChatTransport({
      api: '/api/agent',
      body: () => ({ id: chatIdClassical.value, mode: 'classical' satisfies AgentMode }),
      headers: buildHeaders
    }),
    onFinish: () => {
      storedClassical.value = chatClassical.messages
      refreshSharedQueries()
    }
  })

  const chatCode = new Chat({
    id: chatIdCode.value,
    messages: storedCode.value,
    transport: new DefaultChatTransport({
      api: '/api/agent',
      body: () => ({ id: chatIdCode.value, mode: 'code' satisfies AgentMode }),
      headers: buildHeaders
    }),
    onFinish: () => {
      storedCode.value = chatCode.messages
      refreshSharedQueries()
    }
  })

  const { data: quota } = useFetch<AgentQuota>('/api/agent/quota', {
    key: 'agent-quota',
    server: false,
    lazy: true,
    default: () => null
  })

  const messagesClassical = computed(() => chatClassical.messages)
  const messagesCode = computed(() => chatCode.messages)
  const statusClassical = computed(() => chatClassical.status)
  const statusCode = computed(() => chatCode.status)

  // 'both' resolves to classical so single-thread surfaces (slideover, /chat single view) have a definite source.
  const activeMode = computed<AgentMode>(() => viewMode.value === 'code' ? 'code' : 'classical')
  const messages = computed(() => activeMode.value === 'code' ? messagesCode.value : messagesClassical.value)
  const status = computed(() => activeMode.value === 'code' ? statusCode.value : statusClassical.value)
  const isStreaming = computed(() =>
    statusClassical.value === 'streaming' || statusCode.value === 'streaming'
  )
  // Composer status: in 'both' mode, surface the most active state across threads.
  const composerStatus = computed<ChatStatus>(() => {
    if (viewMode.value !== 'both') return status.value
    const a = statusClassical.value
    const b = statusCode.value
    if (a === 'streaming' || b === 'streaming') return 'streaming'
    if (a === 'submitted' || b === 'submitted') return 'submitted'
    if (a === 'error' || b === 'error') return 'error'
    return 'ready'
  })
  const hasAnyMessages = computed(() => messagesClassical.value.length > 0 || messagesCode.value.length > 0)
  const canClear = computed(() =>
    viewMode.value === 'both' ? hasAnyMessages.value : messages.value.length > 0
  )
  const rateLimited = computed(() => (quota.value?.remaining ?? 1) <= 0)
  const bothAvailable = computed(() => (quota.value?.remaining ?? Number.POSITIVE_INFINITY) >= 2)
  const sendDisabled = computed(() =>
    viewMode.value === 'both' ? !bothAvailable.value : rateLimited.value
  )
  const useContext = computed(() => useCtx.value)

  function stop(): void {
    if (chatClassical.status === 'streaming') chatClassical.stop()
    if (chatCode.status === 'streaming') chatCode.stop()
  }

  function clearThread(mode: AgentMode): void {
    if (mode === 'classical') {
      if (chatClassical.status === 'streaming') chatClassical.stop()
      chatIdClassical.value = crypto.randomUUID()
      chatClassical.messages.splice(0)
      storedClassical.value = []
      return
    }
    if (chatCode.status === 'streaming') chatCode.stop()
    chatIdCode.value = crypto.randomUUID()
    chatCode.messages.splice(0)
    storedCode.value = []
  }

  function clear(): void {
    if (viewMode.value === 'both') {
      if (hasAnyMessages.value && import.meta.client && !window.confirm('Clear both Classical and Code conversations?')) {
        return
      }
      clearThread('classical')
      clearThread('code')
      return
    }
    clearThread(activeMode.value)
  }

  function switchMode(next: ViewMode): void {
    if (viewMode.value === next) return
    viewMode.value = next
  }

  function toggleContext(): void {
    useCtx.value = !useCtx.value
  }

  async function dispatchPrompt(text: string): Promise<void> {
    if (viewMode.value === 'both') {
      await Promise.all([
        chatClassical.sendMessage({ text }),
        chatCode.sendMessage({ text })
      ])
      return
    }
    const target = activeMode.value === 'code' ? chatCode : chatClassical
    await target.sendMessage({ text })
  }

  async function send(): Promise<void> {
    if (!input.value.trim()) return
    if (sendDisabled.value) return
    const text = input.value
    input.value = ''
    await dispatchPrompt(text)
  }

  async function ask(question: string): Promise<void> {
    if (sendDisabled.value) return
    await dispatchPrompt(question)
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
    composerStatus,
    isStreaming,
    canClear,
    rateLimited,
    bothAvailable,
    sendDisabled,
    quota,
    currentPage,
    isOpen,
    input,
    viewMode,
    activeMode,
    useContext,
    faqQuestions: FAQ_QUESTIONS,
    messagesClassical,
    messagesCode,
    statusClassical,
    statusCode,
    hasAnyMessages,
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
