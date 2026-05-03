# PRD: Mode Comparison UI — Classical vs Code vs Both

## Introduction

The agent backend already supports two architectures: `classical` (one MCP tool call per LLM step) and `code` (LLM writes a JS body that batches tool calls in a V8 sandbox). The current UI hides this distinction behind a sliders-icon toggle in the chat slideover, surfaces it nowhere on the full-screen `/chat` page, and `switchMode` clears the conversation — actively destroying any side-by-side comparison the user might attempt.

This feature reframes the project around its most distinctive property: **a live agent running in two modes against the same content**. The chat itself becomes the demo. A new three-state mode picker (`Classical | Code | Both`) lets visitors run the same prompt against both architectures simultaneously and watch the mechanical differences unfold in real time — round-trip count, tool fan-out, latency, cost.

## Goals

- Make the difference between classical and code mode visible by default, not gated behind a "details" toggle.
- Enable a true side-by-side comparison — same prompt, both modes, live streams, observable mechanical differences.
- Surface the per-turn signals that actually distinguish the modes (round-trips, parallel tool fan-out, elapsed time, cost) — not just final text answers.
- Preserve conversation history across mode switches; never destroy the comparison.
- Keep the slideover useful for quick single-mode questions next to a blog post; concentrate the showcase on `/chat`.

## User Stories

### US-001: Two independent Chat instances per mode in the Pinia store
**Description:** As a developer, I need the chat store to hold one `Chat` instance per mode so streams and histories are isolated and `switchMode` no longer destroys data.

**Acceptance Criteria:**
- [ ] `useAgentChatStore` holds `chatClassical` and `chatCode` instances, each with its own `chatId` and session-storage key (`agent-messages-classical`, `agent-messages-code`).
- [ ] `mode` type is `'classical' | 'code' | 'both'` (extend `AgentMode` in `~~/shared/agent`).
- [ ] `switchMode(next)` sets the mode and does NOT call `clear()` or `stop()`.
- [ ] `clear()` clears the active mode's thread in single mode; in Both, clears both threads after a confirmation prompt.
- [ ] `send()` in single mode sends to the active thread; in Both, fires `sendMessage` on both threads in parallel with the same prompt.
- [ ] `useLocalStorage<AgentMode>('agent-mode', 'both')` — default for first-time visitors is Both.
- [ ] Typecheck passes.

### US-002: Three-state mode picker with hero on `/chat` empty state
**Description:** As a first-time visitor, I want to see and understand the mode choice immediately when I land on the chat page.

**Acceptance Criteria:**
- [ ] On `/chat` empty state (`pages/chat.vue`), insert a 3-pill segmented control (`Classical | Code | Both ×2`) between the subhead and the prompt.
- [ ] A one-line description swaps based on the selected pill (e.g., "Same blog. Two agent architectures. Run both side-by-side.").
- [ ] Default selection on first visit is **Both**; subsequent visits restore last-used mode from localStorage.
- [ ] Aggregate metrics (median latency / cost per mode) render as a quiet evidence strip directly below the picker, sourced from `ChatMetricsCompare`'s data.
- [ ] Existing shader, headline, FAQ links are preserved and unaffected.
- [ ] The `Both` pill always carries a `×2` badge indicating it costs two quota slots per send.
- [ ] Verify in browser.

### US-003: Persistent mode picker in `/chat` conversation header
**Description:** As a visitor mid-session, I want to switch modes without clearing my chat so I can compare across multiple turns.

**Acceptance Criteria:**
- [ ] After the first turn lands, a compact 3-pill picker (`Classical | Code | Both ×2`) appears in the top-right of the `/chat` header bar.
- [ ] Currently active pill is visually highlighted.
- [ ] `UColorModeButton` and the existing clear button move into a small overflow menu adjacent to the picker — they remain accessible but stop competing for header attention.
- [ ] Clicking a different pill calls `switchMode(next)` — chat history is preserved.
- [ ] Verify in browser.

### US-004: Slideover removes details toggle, keeps picker only on its empty state
**Description:** As a visitor reading a blog post, I want the slideover to focus on quick answers about the post, not become a comparison surface.

**Acceptance Criteria:**
- [ ] Remove the `showDetails` ref, the `i-lucide-sliders-horizontal` action button, and the `<Transition>` wrapping the details panel from `ChatSlideover.vue`.
- [ ] On slideover empty state, render the same 3-pill picker (compact, no description swap, no metrics strip below).
- [ ] During an active conversation in the slideover, NO mode picker is shown in the header. To switch modes, the user clears the chat (returning to empty state).
- [ ] If the user selects `Both` from the slideover empty state and presses send, the slideover closes and `/chat` opens with that prompt firing in Both mode.
- [ ] Verify in browser.

### US-005: Split-view layout for Both on `/chat`
**Description:** As a visitor, when I select Both, I want to see classical and code answer the same prompt simultaneously in a side-by-side layout.

**Acceptance Criteria:**
- [ ] When `mode === 'both'` on `/chat`, render two columns (50/50) above a single shared prompt input.
- [ ] Left column = classical thread; right column = code thread.
- [ ] Each column has its own scroll container.
- [ ] Single prompt input below both columns; sending dispatches to both threads simultaneously.
- [ ] Each column renders messages using the same `ChatContent` component currently used for single-mode chat.
- [ ] Below `sm` breakpoint, columns stack vertically (slideover never enters this layout — it doesn't render Both).
- [ ] Verify in browser at desktop and tablet widths.

### US-006: Per-column live header ticker
**Description:** As a visitor watching a Both turn, I want to see live mechanical signals on each column so I can read the comparison even when streaming output is sparse.

**Acceptance Criteria:**
- [ ] Each column has a header strip showing three live numbers: elapsed time (s), round-trips, tool calls.
- [ ] Numbers update during streaming and freeze when the turn finishes.
- [ ] After the turn finishes, the frozen numbers remain visible on that message-pair forever (visible on scrollback).
- [ ] The same ticker appears on single-mode views above the latest assistant message.
- [ ] Verify in browser by running a multi-step prompt and watching the numbers move.

### US-007: Per-turn delta strip between columns
**Description:** As a visitor, after a Both turn finishes, I want a clear comparison summary so the punchline of the showcase is visible without mental subtraction.

**Acceptance Criteria:**
- [ ] When a Both turn completes, render a compact strip between the two columns at the vertical position of the user message.
- [ ] Strip shows `Δ` deltas relative to classical: time, round-trips, tools, cost (e.g., `−5.3s · −3 trips · same tools · −$0.0008`).
- [ ] Negative numbers (code's advantage) appear in a neutral or success tone; positive numbers (classical's advantage) appear in a neutral tone — no "winner" labeling.
- [ ] Cost included only if per-turn cost is available; otherwise omit that field.
- [ ] Verify in browser by running a prompt that classical wins and one that code wins.

### US-008: Code-mode tool fan-out chips inside takeover (BACKEND LIFT)
**Description:** As a visitor, I want to see which tools code mode actually called so the split-view comparison is honest about the work each mode performed.

**Acceptance Criteria:**
- [ ] Backend route or `@nuxtjs/mcp-toolkit` integration emits a UIMessage data part for each MCP sub-tool-call fired from inside the sandbox, including tool name, start timestamp, end timestamp, and result summary.
- [ ] `ChatCodeBlock.vue` renders these sub-tool chips below the JS body using the same icons/labels as `tool-renderers.ts`.
- [ ] Sub-tool chips appear concurrently (in parallel fade-in) when the underlying calls fire concurrently — preserving the parallelism story visually.
- [ ] Header ticker `tools` count for code column matches the number of rendered sub-tool chips.
- [ ] Verify in browser by running a prompt that triggers multi-tool fan-out (e.g., "list blog posts and fetch the latest three").

### US-009: Background-stream indicator on picker pills
**Description:** As a visitor who toggles modes mid-stream, I want to see when a stream is still running in a mode I'm not currently viewing.

**Acceptance Criteria:**
- [ ] When `chat.status === 'streaming'` for a `Chat` instance whose mode is not the currently-viewed mode, the picker pill for that mode shows a small pulsing dot.
- [ ] Pulsing dot disappears when the stream finishes.
- [ ] Toggling modes never cancels a running stream (streams own their threads independent of UI visibility).
- [ ] Verify in browser by starting a Both turn and toggling to single-mode mid-stream.

### US-010: Quota awareness for Both mode
**Description:** As a visitor approaching my daily limit, I want clear feedback when Both is no longer affordable so I don't lose half a comparison.

**Acceptance Criteria:**
- [ ] `Both ×2` badge is rendered on the Both pill at all times.
- [ ] Add a `bothAvailable` computed in `useAgentChatStore`: `(quota.value?.remaining ?? Infinity) >= 2`.
- [ ] When `!bothAvailable`, the Both pill is disabled with a tooltip: "Both uses 2 messages per send — switch to single mode to use your last."
- [ ] When `mode === 'both' && !bothAvailable`, the chat prompt's send button is disabled with the same hint.
- [ ] Existing `rateLimited` (remaining ≤ 0) behavior is preserved for single modes.
- [ ] Verify in browser by simulating a quota near the limit.

### US-011: Per-turn telemetry plumbed to client (BACKEND LIFT)
**Description:** As a developer building the header ticker and delta strip, I need per-turn metrics flowing to the client.

**Acceptance Criteria:**
- [ ] `server/api/agent.post.ts` emits per-turn telemetry into the response stream: step count, tool count, elapsed ms, input/output tokens, estimated cost.
- [ ] Telemetry is associated with the assistant message it describes (carries the message id).
- [ ] Client-side, telemetry is read in `useAgentChatStore` (or a sibling composable) and exposed per-message so `ChatContent`-adjacent components can render it.
- [ ] Existing session-aggregate `agent/metrics.get.ts` is unaffected.
- [ ] Typecheck passes.

### US-012: Mode-aware empty-state in slideover after switching to Both
**Description:** As a visitor in the slideover who selects Both, I want a clear path to the full-screen comparison view.

**Acceptance Criteria:**
- [ ] When the slideover empty state has `Both` selected and the user presses send for the first time, the slideover closes (`open = false`) and `/chat` opens with the prompt already dispatched to both threads.
- [ ] If the user instead toggles back to a single mode before sending, the slideover stays open and behaves as today.
- [ ] No auto-expand happens just from selecting Both; only on send.
- [ ] Verify in browser.

## Functional Requirements

- **FR-1**: The system must support three modes — `classical`, `code`, `both` — exposed via `AgentMode` in `~~/shared/agent`.
- **FR-2**: The Pinia store must hold two independent `Chat` instances (one per single mode) with isolated `chatId`s and session-storage keys.
- **FR-3**: `switchMode` must NOT clear conversation history or stop running streams.
- **FR-4**: Send actions in `Both` mode must dispatch the same prompt to both `Chat` instances simultaneously.
- **FR-5**: The first-time-visitor default mode must be `both`; subsequent visits restore the last-used mode.
- **FR-6**: The mode picker must appear as a hero in the `/chat` empty state and as a compact 3-pill control in the `/chat` conversation header.
- **FR-7**: The slideover must show the picker only on its empty state; no in-conversation picker is shown there.
- **FR-8**: Selecting `Both` and pressing send from the slideover empty state must close the slideover and dispatch the prompt on `/chat`.
- **FR-9**: When `mode === 'both'` on `/chat`, the conversation area must render as two side-by-side columns with a single shared prompt input below.
- **FR-10**: Each column must display a live header ticker showing elapsed time, round-trip count, and tool count; values must update during streaming and persist after.
- **FR-11**: After a `Both` turn completes, a per-turn delta strip must be rendered between the two columns at the position of the user message, showing `Δ` deltas relative to classical for time, round-trips, tools, and cost.
- **FR-12**: Code-mode rendering must surface the inner MCP sub-tool-calls fired from inside the sandbox as chips beneath the JS body in `ChatCodeBlock.vue`.
- **FR-13**: Sub-tool-call chips that fire concurrently in the sandbox must appear concurrently in the UI (not sequentially staggered).
- **FR-14**: Picker pills for modes with active background streams must display a pulsing indicator dot.
- **FR-15**: The `Both` pill must always display a `×2` cost badge.
- **FR-16**: When the daily quota remaining is less than 2, the `Both` pill must be disabled and (if the active mode is `Both`) the send button must be disabled, both with a tooltip explaining the cause.
- **FR-17**: The backend route must emit per-turn telemetry (steps, tool count, elapsed ms, tokens, estimated cost) on the response stream, associated with the relevant message id.
- **FR-18**: The backend route or MCP toolkit integration must emit a UIMessage data part for each sub-tool-call fired from inside the code-mode sandbox, including tool name and timestamps.
- **FR-19**: The `showDetails` ref, the sliders-horizontal action button, and the `ChatMetricsCompare` instance currently inside the slideover details panel must be removed.

## Non-Goals (Out of Scope)

- **No Gantt chart / timeline visualization.** Concurrent chip fade-in conveys parallelism without per-tool start/end bars. Defer until data shows the chips are insufficient.
- **No "winner" stamp or competitive framing.** The delta strip is factual; no celebratory styling on the faster column.
- **No automatic mode recommendation.** The picker doesn't tell users which mode to pick for a specific question.
- **No mid-stream cancel-on-toggle.** Toggling the picker never cancels a running stream — that's what the per-stream stop button is for.
- **No three-way mode selector inside the slideover during conversation.** Users must clear chat to access the picker in the slideover.
- **No quota-burst protection beyond the existing daily limit.** The `Both ×2` charging is the existing per-call rate limit applied twice — no new quota system.
- **No persistent storage of mode-comparison data across browsers/devices.** All state lives in localStorage and sessionStorage.
- **No PR-quality polish on dark-mode color tokens for the delta strip on first ship.** Use existing semantic tokens; iterate later.

## Design Considerations

- **Reuse existing components**: `ChatContent`, `ChatToolRender`, `ChatCodeBlock`, `tool-renderers.ts`, `UChatMessages`, `UChatPrompt`, `ChatPromptFooter`, `UTabs`/segmented-control patterns from Nuxt UI.
- **Picker component**: a single shared component used in three contexts — empty-state hero (large), `/chat` header (compact), slideover empty state (compact). Variant prop or size prop, not three components.
- **Split-view layout**: a new layout component (e.g., `ChatSplitView.vue`) wrapping two `UChatMessages` instances. Pass each its own `messages` and `status` from the relevant `Chat` instance.
- **Header ticker**: a small reactive component reading from per-message telemetry. Lives at the top of each column for the in-flight turn; freezes after.
- **Delta strip**: positioned absolutely or via CSS grid so it spans the gap between columns at the vertical level of the user message. Avoid rendering it inline inside one column.
- **Chip concurrency**: when sub-tool-call data parts arrive on the stream, render in arrival order with a fade-in animation that does not stagger artificially. If two arrive in the same frame, both fade in together.
- **Color tone**: use existing semantic colors (`text-muted`, `text-success`, `text-default`). Do not introduce new palette entries for this feature.

## Technical Considerations

- **Architecture brain note**: see `brain/codebase/agent-chat-architecture.md` — the Pinia singleton is the right home for state; extend from one `Chat` to two `Chat` instances inside the same shape.
- **Code-mode brain note**: see `brain/codebase/code-mode.md` — the `experimental_codeMode: true` toolkit's loopback RPC server already knows about every sub-tool-call. Surface this to the AI SDK message stream as additional UIMessage data parts.
- **Streaming quirks**: Anthropic `input_json_delta` arrives in coarse bursts. The header ticker (US-006) is critical to making the code column feel alive during the ~2s burst-wait.
- **Two parallel `useChat` instances**: verify `@ai-sdk/vue`'s `Chat` class supports two simultaneous active streams in one Pinia store. If it does not, file the issue and consider serializing both to a single backend round-trip that returns combined output.
- **Quota race**: in `Both`, the two backend calls are independent — if one passes the quota check and the other fails, the user gets half a comparison. Mitigate by checking `bothAvailable` client-side before send (US-010); accept the small race window where two requests are in flight when remaining was exactly 2.
- **Auto-expand from slideover**: implement via `expandToFullScreen()` already present in the store, called from the slideover's send handler when the active mode is `both`.
- **Existing `switchMode` callers**: `ChatSlideover.vue` and any new picker components. Update all to drop the assumption that switching clears.

## Success Metrics

- A first-time visitor lands on `/chat`, sends one prompt, and observes both modes streaming side-by-side without taking any action other than typing the prompt.
- The header ticker on the code column shows movement (timer ticks, round-trip counter changes) within 500ms of send, even before the JS body lands — eliminating the perceived dead-air during input_json_delta bursts.
- After a turn finishes, the delta strip renders within 100ms of the slower side completing.
- Mode toggling preserves chat history with zero clears (verifiable: send 3 prompts in classical, switch to Both, history is intact in the classical column; switch to code-only, classical and Both pills both show pulsing-dot if either has a fresh stream).
- Inner-tool-call chips render in code-mode takeover for every tool that was called from the sandbox, with chip count matching the header ticker tool count.
- Quota footer never lies: a Both turn decrements the visible quota by 2; a single-mode turn decrements by 1.

## Open Questions

- Does `@ai-sdk/vue` support two concurrent `Chat` instances writing to two independent stream sources in one component tree? If not, what's the fallback? (Investigation needed before US-001 starts.)
- How should the auto-expand from slideover (US-012) handle the case where the user has already sent prompts in single mode in the slideover? Do those slideover messages carry over visually to `/chat`? (Pinia store is shared, so the data is there — confirm the user's mental model expects to see them on `/chat`.)
- For the per-turn cost in the delta strip (US-007 / FR-11): does the current backend already produce per-turn cost, or only session aggregate? If aggregate-only, US-011 must include cost; otherwise mark cost as a phase-2 nice-to-have.
- When `Both` is selected and the user clears chat, does the store clear both threads in lockstep, or only the one whose column was clicked? (Current decision: clears both with confirmation. Validate in implementation.)
- What's the desired behavior on browsers narrower than `sm` for the `/chat` Both layout — stacked columns, or auto-degrade to the user's last single mode with a "wider screen recommended" hint?
