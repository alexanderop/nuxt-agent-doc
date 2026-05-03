# Agent Chat Architecture

The chat feature lives in a single Pinia store: `app/stores/useAgentChat.ts`. The store holds **two** `Chat` instances — `chatClassical` and `chatCode` — one per server-facing `AgentMode`. Each instance has its own `chatId`, sessionStorage key (`agent-messages-classical` / `agent-messages-code`), and stream lifecycle. `AbstractChat` (`node_modules/ai/dist/index.mjs`) gives each instance its own `state`, `activeResponse`, `jobExecutor`, and `transport`, so two parallel streams are structurally safe. All chat surfaces (`ChatSlideover`, `/chat` page, header trigger) read from this store.

## ViewMode vs AgentMode

`AgentMode = 'classical' | 'code'` is server-facing — the request body always carries one of these. `ViewMode = AgentMode | 'both'` is UI-only — `'both'` is never sent to the server; instead, the store dispatches `sendMessage` to both `Chat` instances in parallel. This makes "the server received Both" structurally impossible.

`switchMode(next)` flips `viewMode` and **does not** clear or stop streams — history is preserved across mode switches. `clear()` is mode-aware: in single mode it clears that thread; in `'both'` it confirms then clears both.

## The Constraints That Drove This Shape

- **`createSharedComposable` is per-JS-context, not per-request.** On a shared Node SSR process it leaks state across requests. Pinia binds stores to the Nuxt app instance, so it's the right home for chat state.
- **The `Chat` instance must survive navigation.** A per-mount design rebuilt `new Chat(...)` whenever `<ChatSlideover>` or `<ChatPage>` mounted; expanding from `/` to `/chat` mid-stream killed the active stream. Pinia's singleton lifetime fixes this.
- **Dynamic params go through `transport.body`/`headers` callbacks, not Chat re-instantiation.** `chatId`, `mode`, and `x-page-path` change at runtime; rebuilding `Chat` would lose in-flight streams. Callbacks are evaluated per-request — see `app/stores/useAgentChat.ts` (`transport: new DefaultChatTransport({ ... body: () => ({ id, mode }), headers: () => ... })`). `chatId.value = crypto.randomUUID()` in `clear()` takes effect on the next message without touching the Chat instance.

## Public Surface

Components consume only the store's named returns (`messages`, `status`, `send`, `ask`, `stop`, `clear`, `switchMode`, `expandToFullScreen`, `collapseToSidebar`, etc.) — never the underlying `Chat`. Keeping `Chat` private means we can swap the SDK or wrap behavior without churning components.

## Server-side tools

`server/api/agent.post.ts` builds its tool set in-process from `server/utils/tools/` — no MCP HTTP transport, no `/mcp` endpoint. Each tool file exports its Zod schema, raw handler, and the `tool()`-wrapped AI SDK form so code-mode can reuse the handlers via `contentToolFns`. See [[code-mode]].

## Related

- [[../principles/composables-are-the-unit-of-logic]] — composables/stores own state; components are dumb.
- [[../principles/boundary-discipline]] — `x-page-path` enters at the SSR/transport boundary; validate there.
- [[../principles/make-illegal-states-unrepresentable]] — singleton lifetime + per-request callbacks make "two Chats racing the same stream" structurally impossible.
- [[gotchas]] — Vite 7 `viteEnvironmentApi` flag, comark over MDC for streaming markdown.
