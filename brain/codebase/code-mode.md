# Code Mode

The agent runs in two modes: `classical` (one-tool-per-call) and `code` (LLM writes a JS body that batches tool calls). `server/api/agent.post.ts` picks the MCP endpoint based on `mode` from the request body.

## Endpoints

- `/api/agent` — chat endpoint.
- `/mcp` — classical MCP endpoint. Tools are auto-discovered from `server/mcp/tools/*.ts`.
- `/mcp/code` — code-mode MCP endpoint. Defined by `server/mcp/code.ts` with `experimental_codeMode: true` and an explicit `tools: [...]` list.

There is no shared-tag API. Both endpoints expose the same six tool modules today, but classical gets them via auto-discovery and code-mode lists them explicitly — keep both lists in sync when adding a tool. `show_post` is registered at the AI SDK level in `agent.post.ts` (`tools: { ...mcpTools, show_post: showPostTool }`), so it's available in both modes without going through MCP.

## Security Model

Code-mode execution lives inside `@nuxtjs/mcp-toolkit`'s `experimental_codeMode: true`, not the Nuxt process. Under the hood the toolkit loads `secure-exec`'s `NodeRuntime` to run the LLM-written JS in an isolated sandbox; tool calls flow back to the host process through a token-secured loopback HTTP server (random port on `127.0.0.1`, `x-rpc-token` header). Network access from the sandbox is restricted to that RPC server. Without that separation a model could `require('fs')` and read `.env`.

The page-path that flows into the system prompt comes from the `x-page-path` header — it's user-controlled. Validate at the boundary: cap length, reject `..` and `//`, anchor a regex. See [[../principles/boundary-discipline]].

## Mode-Aware System Prompt

`buildSystemPrompt(pagePath, mode)` appends `CODE_MODE_ADDENDUM` only when `mode === 'code'`. The addendum frames the JS body as a scratchpad for "discovery + fetching in one block". A mode-agnostic base prompt wastes round-trips because the model doesn't know the calling convention.

## Streaming Quirks

- Anthropic `input_json_delta` arrives in **coarse bursts**, not character-by-character. A ~150-char `code` body lands in one chunk around 2s in. UI must show a `writing…` placeholder, not assume per-char streaming will visibly progress.
- `MAX_STEPS = 8` in `server/api/agent.post.ts`. Multi-step turns (discovery + fetching) are normal — running twice in one turn is not a bug.

## Related

- [[agent-chat-architecture]]
- [[../principles/observable-agent-activity]]
- [[../principles/experience-first]]
- [[../principles/boundary-discipline]]
