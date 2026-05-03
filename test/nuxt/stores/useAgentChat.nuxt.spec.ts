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

function currentChat(): ChatStub {
  const last = chatInstances.at(-1)
  if (!last) throw new Error('no Chat instance was created')
  return last
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
  it('starts empty in classical mode with the slideover closed', async () => {
    const store = await mountAgentStore()
    expect(store.messages).toEqual([])
    expect(store.mode).toBe('classical')
    expect(store.isOpen).toBe(false)
    expect(store.useContext).toBe(true)
    expect(store.canClear).toBe(false)
    expect(store.input).toBe('')
  })

  it('hydrates messages from sessionStorage on first access', async () => {
    const seeded: StubMessage[] = [{ id: 'u-0', role: 'user', parts: [{ type: 'text', text: 'hello' }] }]
    sessionStorage.setItem('agent-messages', JSON.stringify(seeded))
    const store = await mountAgentStore()
    expect(store.messages).toEqual(seeded)
    expect(store.canClear).toBe(true)
  })
})

describe('useAgentChatStore — sending', () => {
  it('sends typed input and clears the textarea', async () => {
    const store = await mountAgentStore()
    store.input = 'what is nuxt?'
    await store.send()
    expect(currentChat().sendMessage).toHaveBeenCalledWith({ text: 'what is nuxt?' })
    expect(store.input).toBe('')
    expect(store.messages.map(m => m.role)).toEqual(['user', 'assistant'])
  })

  it('ignores whitespace-only input', async () => {
    const store = await mountAgentStore()
    store.input = '   '
    await store.send()
    expect(currentChat().sendMessage).not.toHaveBeenCalled()
    expect(store.messages).toEqual([])
  })

  it('ask() sends the given question without touching input', async () => {
    const store = await mountAgentStore()
    store.input = 'staged'
    await store.ask('what is the latest TIL?')
    expect(currentChat().sendMessage).toHaveBeenCalledWith({ text: 'what is the latest TIL?' })
    expect(store.input).toBe('staged')
  })
})

describe('useAgentChatStore — clear and switchMode', () => {
  it('clear() empties messages, regenerates chatId, and wipes sessionStorage', async () => {
    const store = await mountAgentStore()
    await store.ask('seed')
    const firstId = currentChat().id
    expect(store.canClear).toBe(true)

    store.clear()

    expect(store.messages).toEqual([])
    await vi.waitFor(() => expect(sessionStorage.getItem('agent-messages')).toBe('[]'))
    expect(localStorage.getItem('agent-chat-id')).not.toBe(JSON.stringify(firstId))
  })

  it('clear() stops a streaming chat before resetting', async () => {
    const store = await mountAgentStore()
    currentChat().startStreaming()
    store.clear()
    expect(currentChat().stop).toHaveBeenCalled()
  })

  it('switchMode(next) stops, flips mode, and clears messages', async () => {
    const store = await mountAgentStore()
    await store.ask('seed')
    expect(store.messages.length).toBeGreaterThan(0)

    store.switchMode('code')

    expect(store.mode).toBe('code')
    expect(store.messages).toEqual([])
  })

  it('switchMode(same) is a no-op — preserves messages', async () => {
    const store = await mountAgentStore()
    await store.ask('seed')
    const before = [...store.messages]

    store.switchMode('classical')

    expect(store.messages).toEqual(before)
    expect(currentChat().stop).not.toHaveBeenCalled()
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
})

describe('useAgentChatStore — persistence side effects', () => {
  it('onFinish writes the message list to sessionStorage', async () => {
    const store = await mountAgentStore()
    await store.ask('hi')
    const stored = JSON.parse(sessionStorage.getItem('agent-messages') ?? '[]')
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
