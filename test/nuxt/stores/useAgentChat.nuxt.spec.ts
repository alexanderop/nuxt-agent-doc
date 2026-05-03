import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'

type StubMessage = { id: string, role: 'user' | 'assistant', parts: { type: 'text', text: string }[] }
type QuotaValue = { remaining: number, limit: number, used: number } | null

interface ChatStub {
  id: string
  messages: StubMessage[]
  status: 'ready' | 'streaming'
  onFinish: () => void
  sendMessage: (msg: { text: string }) => Promise<void>
  stop: () => void
  startStreaming: () => void
  finishStreaming: () => void
}

const {
  chatInstances,
  pushSpy,
  quotaRef
} = vi.hoisted(() => {
  const hoistedChatInstances: ChatStub[] = []
  const hoistedPushSpy = vi.fn(async () => {})
  const hoistedQuotaRef: { value: QuotaValue } = {
    value: {
      remaining: 5,
      limit: 20,
      used: 15
    }
  }

  return {
    chatInstances: hoistedChatInstances,
    pushSpy: hoistedPushSpy,
    quotaRef: hoistedQuotaRef
  }
})

vi.mock('@ai-sdk/vue', () => {
  class Chat implements ChatStub {
    id: string
    messages: StubMessage[]
    status: 'ready' | 'streaming' = 'ready'
    onFinish: () => void
    constructor(opts: { id: string, messages?: StubMessage[], onFinish?: () => void }) {
      this.id = opts.id
      this.messages = [...(opts.messages ?? [])]
      this.onFinish = opts.onFinish ?? (() => {})
      chatInstances.push(this)
    }

    sendMessage = vi.fn(async ({ text }: { text: string }) => {
      this.startStreaming()
      this.messages.push({
        id: `u-${this.messages.length}`,
        role: 'user',
        parts: [{ type: 'text', text }]
      })
      this.messages.push({
        id: `a-${this.messages.length}`,
        role: 'assistant',
        parts: [{ type: 'text', text: `echo: ${text}` }]
      })
      this.finishStreaming()
      this.onFinish()
    })

    stop = vi.fn(() => { this.status = 'ready' })
    startStreaming() { this.status = 'streaming' }
    finishStreaming() { this.status = 'ready' }
  }
  return { Chat }
})

vi.mock('ai', () => {
  class DefaultChatTransport {
    opts: unknown
    constructor(opts: unknown) {
      this.opts = opts
    }
  }
  return { DefaultChatTransport }
})

registerEndpoint('/api/agent/quota', () => quotaRef.value)
const { useAgentChatStore } = await import('~/stores/useAgentChat')

type AgentChatStore = ReturnType<typeof useAgentChatStore>

let currentWrapper: Awaited<ReturnType<typeof mountSuspended>> | null = null
let currentStore: AgentChatStore | null = null

async function mountAgentStore(options: { route?: string, stubNavigation?: boolean } = {}): Promise<AgentChatStore> {
  let store!: AgentChatStore

  currentWrapper = await mountSuspended(defineComponent({
    setup() {
      setActivePinia(createPinia())
      if (options.stubNavigation) {
        const router = useRouter()
        vi.spyOn(router, 'push').mockImplementation(pushSpy)
      }
      store = useAgentChatStore()
      currentStore = store
      return () => h('div')
    }
  }), {
    route: options.route ?? '/'
  })

  return store
}

function classicalChat(): ChatStub {
  const chat = chatInstances[0]
  if (!chat) throw new Error('no Chat instance was created')
  return chat
}

function codeChat(): ChatStub {
  const chat = chatInstances[1]
  if (!chat) throw new Error('code Chat instance was not created')
  return chat
}

beforeEach(() => {
  currentWrapper?.unmount()
  currentWrapper = null
  currentStore?.$dispose()
  currentStore = null
  setActivePinia(createPinia())
  sessionStorage.clear()
  localStorage.clear()
  chatInstances.length = 0
  pushSpy.mockClear()
  quotaRef.value = { remaining: 5, limit: 20, used: 15 }
})

describe('useAgentChatStore — initial state', () => {
  it('starts empty in both mode with the slideover closed', async () => {
    const store = await mountAgentStore()
    expect(store.messagesClassical).toEqual([])
    expect(store.messagesCode).toEqual([])
    expect(store.viewMode).toBe('both')
    expect(store.isOpen).toBe(false)
    expect(store.useContext).toBe(true)
    expect(store.canClear).toBe(false)
    expect(store.input).toBe('')
  })

  it('creates two Chat instances — one per mode', async () => {
    await mountAgentStore()
    expect(chatInstances).toHaveLength(2)
    expect(chatInstances[0]?.id).not.toBe(chatInstances[1]?.id)
  })

  it('hydrates classical messages from per-mode sessionStorage', async () => {
    const seeded: StubMessage[] = [{ id: 'u-0', role: 'user', parts: [{ type: 'text', text: 'hello' }] }]
    sessionStorage.setItem('agent-messages-classical', JSON.stringify(seeded))
    const store = await mountAgentStore()
    expect(store.messagesClassical).toEqual(seeded)
    expect(store.canClear).toBe(true)
  })
})

describe('useAgentChatStore — sending', () => {
  it('in both mode, send dispatches to both Chat instances', async () => {
    const store = await mountAgentStore()
    store.input = 'what is nuxt?'
    await store.send()
    expect(classicalChat().sendMessage).toHaveBeenCalledWith({ text: 'what is nuxt?' })
    expect(codeChat().sendMessage).toHaveBeenCalledWith({ text: 'what is nuxt?' })
    expect(store.input).toBe('')
  })

  it('in single mode, send dispatches only to the active thread', async () => {
    const store = await mountAgentStore()
    store.switchMode('classical')
    store.input = 'classical-only'
    await store.send()
    expect(classicalChat().sendMessage).toHaveBeenCalledWith({ text: 'classical-only' })
    expect(codeChat().sendMessage).not.toHaveBeenCalled()
  })

  it('ignores whitespace-only input', async () => {
    const store = await mountAgentStore()
    store.input = '   '
    await store.send()
    expect(classicalChat().sendMessage).not.toHaveBeenCalled()
    expect(codeChat().sendMessage).not.toHaveBeenCalled()
  })

  it('ask() sends to the active mode without touching input', async () => {
    const store = await mountAgentStore()
    store.switchMode('code')
    store.input = 'staged'
    await store.ask('what is the latest TIL?')
    expect(codeChat().sendMessage).toHaveBeenCalledWith({ text: 'what is the latest TIL?' })
    expect(classicalChat().sendMessage).not.toHaveBeenCalled()
    expect(store.input).toBe('staged')
  })
})

describe('useAgentChatStore — clear and switchMode', () => {
  it('switchMode preserves messages — never destroys history', async () => {
    const store = await mountAgentStore()
    store.switchMode('classical')
    await store.ask('seed')
    const before = [...store.messagesClassical]

    store.switchMode('code')
    expect(store.messagesClassical).toEqual(before)
    expect(classicalChat().stop).not.toHaveBeenCalled()
  })

  it('clear() in single mode clears only that thread', async () => {
    const store = await mountAgentStore()
    store.switchMode('classical')
    await store.ask('seed-classical')
    store.switchMode('code')
    await store.ask('seed-code')

    store.switchMode('classical')
    store.clear()

    expect(store.messagesClassical).toEqual([])
    expect(store.messagesCode.length).toBeGreaterThan(0)
  })

  it('clear() in single mode rotates the chatId for that thread only', async () => {
    const store = await mountAgentStore()
    store.switchMode('classical')
    const beforeClassical = localStorage.getItem('agent-chat-id-classical')
    const beforeCode = localStorage.getItem('agent-chat-id-code')
    await store.ask('seed')

    store.clear()

    await vi.waitFor(() => {
      expect(localStorage.getItem('agent-chat-id-classical')).not.toBe(beforeClassical)
    })
    expect(localStorage.getItem('agent-chat-id-code')).toBe(beforeCode)
  })

  it('clear() stops a streaming chat before resetting', async () => {
    const store = await mountAgentStore()
    store.switchMode('classical')
    classicalChat().startStreaming()
    store.clear()
    expect(classicalChat().stop).toHaveBeenCalled()
  })

  it('switchMode(same) is a no-op', async () => {
    const store = await mountAgentStore()
    store.switchMode('classical')
    await store.ask('seed')
    const before = [...store.messagesClassical]

    store.switchMode('classical')

    expect(store.messagesClassical).toEqual(before)
  })
})

describe('useAgentChatStore — context and page derivation', () => {
  it('toggleContext() flips useContext', async () => {
    const store = await mountAgentStore()
    expect(store.useContext).toBe(true)
    store.toggleContext()
    expect(store.useContext).toBe(false)
    store.toggleContext()
    expect(store.useContext).toBe(true)
  })

  it.each([
    ['/blog/foo', '/blog/foo'],
    ['/notes/bar', '/notes/bar'],
    ['/til/baz', '/til/baz']
  ])('currentPage returns the path for %s', async (path, expected) => {
    const store = await mountAgentStore({ route: path })
    expect(store.currentPage).toBe(expected)
  })

  it.each([['/'], ['/tags/ai'], ['/tags/vue']])(
    'currentPage is null for non-context routes (%s)',
    async (path) => {
      const store = await mountAgentStore({ route: path })
      expect(store.currentPage).toBeNull()
    }
  )
})

describe('useAgentChatStore — rate limiting', () => {
  it('rateLimited is false when remaining > 0', async () => {
    quotaRef.value = { remaining: 3, limit: 20, used: 17 }
    const store = await mountAgentStore()
    expect(store.rateLimited).toBe(false)
  })

  it('rateLimited is true when remaining is 0', async () => {
    quotaRef.value = { remaining: 0, limit: 20, used: 20 }
    const store = await mountAgentStore()
    await vi.waitFor(() => expect(store.rateLimited).toBe(true))
  })

  it('rateLimited is false when quota has not loaded yet (optimistic)', async () => {
    quotaRef.value = null
    const store = await mountAgentStore()
    expect(store.rateLimited).toBe(false)
  })

  it('bothAvailable is true when remaining ≥ 2', async () => {
    quotaRef.value = { remaining: 2, limit: 20, used: 18 }
    const store = await mountAgentStore()
    await vi.waitFor(() => expect(store.bothAvailable).toBe(true))
  })

  it('bothAvailable is false when remaining is 1', async () => {
    quotaRef.value = { remaining: 1, limit: 20, used: 19 }
    const store = await mountAgentStore()
    await vi.waitFor(() => expect(store.bothAvailable).toBe(false))
  })

  it('sendDisabled in single mode mirrors rateLimited', async () => {
    quotaRef.value = { remaining: 1, limit: 20, used: 19 }
    const store = await mountAgentStore()
    store.switchMode('classical')
    await vi.waitFor(() => expect(store.bothAvailable).toBe(false))
    expect(store.sendDisabled).toBe(false)
  })
})

describe('useAgentChatStore — persistence side effects', () => {
  it('onFinish writes the per-mode message list to sessionStorage', async () => {
    const store = await mountAgentStore()
    store.switchMode('classical')
    await store.ask('hi')
    const stored = JSON.parse(sessionStorage.getItem('agent-messages-classical') ?? '[]')
    expect(stored).toHaveLength(2)
  })
})

describe('useAgentChatStore — navigation', () => {
  it('expandToFullScreen() closes the slideover and pushes /chat', async () => {
    const store = await mountAgentStore({ stubNavigation: true })
    store.isOpen = true
    await store.expandToFullScreen()
    expect(store.isOpen).toBe(false)
    expect(pushSpy).toHaveBeenCalledWith('/chat')
  })

  it('collapseToSidebar() pushes / and opens the slideover', async () => {
    const store = await mountAgentStore({ stubNavigation: true })
    store.isOpen = false
    await store.collapseToSidebar()
    expect(pushSpy).toHaveBeenCalledWith('/')
    expect(store.isOpen).toBe(true)
  })
})
