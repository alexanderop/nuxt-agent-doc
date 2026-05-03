# Code Mode

The agent runs in two modes: `classical` (one-tool-per-call) and `code` (LLM writes a JS body that batches tool calls). `server/api/agent.post.ts` switches the tool set based on the `mode` field of the request body.

## Tool Sets

Both modes use AI SDK tools defined in-process under `server/utils/tools/`:

- `classical`: `{ ...contentTools, show_post: showPostTool }` — six content tools + `show_post`.
- `code`: `{ code: codeTool, show_post: showPostTool }` — a single `code` tool wraps the six content tools. `show_post` stays a real tool because the model invokes it *after* the `code` step.

There is no `/mcp` HTTP endpoint and no MCP client. The earlier `@nuxtjs/mcp-toolkit` integration was removed; tools are loaded as in-process `tool()` definitions and the agent endpoint passes them directly to `streamText`.

## Sandbox

`server/utils/code-runtime.ts` owns the V8 isolate. Flow:

1. `codeTool.execute({ code })` calls `executeCode(code, contentToolFns)`.
2. A loopback HTTP RPC server (random port on `127.0.0.1`, token in `x-rpc-token`) is brought up once and reused.
3. `secure-exec`'s `NodeRuntime` is created once with a `NetworkAdapter` that allowlists ONLY that RPC server. No DNS, no raw HTTP — `require('fs')` and `process.env` are unreachable.
4. The sandbox script gets a `codemode` proxy that `fetch`es each call back through RPC. The host restores the H3 `useEvent()` context for each call via `AsyncLocalStorage.snapshot()`, so tool handlers can still call `useEvent()` to query Nuxt Content.
5. The user code's return value is piped back through a magic `__return__` RPC tool. Wall time, tool-call count, and result size are all bounded.

The page-path that flows into the system prompt comes from the `x-page-path` header — it's user-controlled. Validate at the boundary: cap length, reject `..` and `//`, anchor a regex. See [[../principles/boundary-discipline]].

## Mode-Aware System Prompt

`buildSystemPrompt(pagePath, mode)` appends `CODE_MODE_ADDENDUM` only when `mode === 'code'`. The addendum tells the model the `code` tool takes `{ code: "..." }` and frames the JS body as a scratchpad for "discovery + fetching in one block". A mode-agnostic base prompt wastes round-trips because the model doesn't know the calling convention.

## Streaming Quirks

- Anthropic `input_json_delta` arrives in **coarse bursts**, not character-by-character. A ~150-char `code` body lands in one chunk around 2s in. UI must show a `writing…` placeholder, not assume per-char streaming will visibly progress.
- `MAX_STEPS = 8` in `server/api/agent.post.ts`. Multi-step turns (discovery + fetching) are normal — running twice in one turn is not a bug.

## Sub-tool data parts

The `code` tool is built via a `createCodeTool({ writer, onSubToolCall })` factory inside `createUIMessageStream`'s execute callback so it can close over `writer`. The factory wires the V8 sandbox's `onSubToolCall` callback (added to `ExecOptions` in `code-runtime.ts`) to emit `data-subtool-call` UIMessage data parts on the stream — one start event then one end event per RPC call, scoped by id `${codeToolCallId}-${seq}` so both events reconcile to the same chip in the UI. `ChatCodeBlock` filters parts by `data.codeToolCallId === part.toolCallId` to render the chip strip beneath each code block.

## Per-turn telemetry

`streamText`'s `onStepFinish` accumulates step count, sub-tool count (from the factory's `onSubToolCall`), tokens, elapsed ms, and estimated cost. It writes a single `data-turn-metrics` part with stable id `'turn-metrics'` so each step's emission overwrites the prior one. UI components (`ChatTurnTicker`, `ChatTurnDeltaStrip`) walk `message.parts` for the latest such part. Because the AI SDK only sees one `code` tool call per step, the in-mode "tools" count is computed as `subToolCount + nonCodeToolCount` — the meaningful work, not the LLM's surface call count.

## Related

- [[agent-chat-architecture]]
- [[../principles/observable-agent-activity]]
- [[../principles/experience-first]]
- [[../principles/boundary-discipline]]
