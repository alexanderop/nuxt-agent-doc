# Observable Agent Activity

Whatever the agent is doing — generating code, calling tools, fetching content, deciding — the user should be able to see it happen. A black box that lights up only at the end is a bug, not a stylistic choice.

**Why:** Long pauses with no visible state make users believe the agent is broken or stuck, even when it's working correctly. Trust in the system is built moment-to-moment, not at completion. The cost of a `writing…` placeholder is one line of CSS; the cost of a user reloading mid-stream is a wasted turn and a damaged trust signal.

This is the agent-product instance of [[experience-first]]: the experience of *waiting* is part of the product surface.

**The Pattern:**
- **Stream what you can stream.** Tokens, tool input deltas, intermediate steps. If the SDK forwards it, render it.
- **Render placeholders before the first byte.** Anthropic `input_json_delta` and similar streams arrive in coarse bursts, not character-by-character. There can be 1–2s between a tool starting and the first delta. A `min-h` placeholder with a `writing…` label keeps the surface alive.
- **Show inputs, not just outputs.** A tool card that displays the JS body the model wrote, the search query it issued, or the URL it fetched is more trustworthy than a chip that just says "tool ran."
- **Side-by-side comparisons earn their pixels.** When two modes (classical vs. code) or two configurations exist, render both so the user can see the difference, not just toggle blindly.
- **Status from the chat-level source of truth.** Per-tool reactivity flags (e.g. `part.state` on `DynamicToolUIPart`) get mutated in place by the SDK and don't always cross the `defineProps` boundary. AND with the chat's overall `status` from the store — once chat is `ready`, no tool can still be streaming.

**The Tests:**
- "If I unplug network mid-turn, does the user know what's happening?" If the surface is blank, instrument it.
- "Is there ever a >1s window with no visible state change?" If yes, add a placeholder.
- "Can the user see *what* the agent is doing, not just *that* it's doing something?" If only the latter, surface the input.

**Anti-patterns:**
- Gating the body on `v-if="showCode && code"` so the card only appears once the first delta lands. Drop the `&& code`; show the placeholder first.
- Caveats framed as "pre-existing SDK behavior" when the symptom is user-visible. Fix the surface; the SDK's defaults are not the user's problem.
- Re-stringifying tool output on every chunk (`v-if` calls + interpolation calls of the same `JSON.stringify`). Memoize via a per-tool child component with a `computed`.

Related: [[experience-first]], [[../codebase/code-mode]] (streaming quirks specific to this app), [[../codebase/agent-chat-architecture]] (where the chat-level status lives).
