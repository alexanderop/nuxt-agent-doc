# Testing Strategy

Three layers, each with a distinct job. Mock only at the network boundary. Every component is accountable for its own a11y. The test reads as a story; the DOM is queried the way a user (or screen reader) reads it.

Reference exemplar: [npmx.dev](https://github.com/npmx-dev/npmx.dev) — a Nuxt 4 / Nitro / UnoCSS open-source project that demonstrates this strategy at scale. Mirror their structure when in doubt.

**Why:** Mixed-purpose test suites rot. When unit tests reach into the DOM, e2e tests stub internals, and components are tested through three different abstractions, every refactor breaks tests for the wrong reason and teams stop trusting the suite. Splitting by *what each layer can verify* keeps each layer fast, focused, and refactor-resilient.

## The Layers

**1. Unit (`test/unit/`, `environment: 'node'`)**
Pure functions, parsers, formatters, transformers — anything with no Vue, no DOM, no fetch. Fast feedback, runs on every save.

*Good candidates:*
- `parseSuggestionIntent('@AnGuLAR')` → `{ intent: 'org', name: 'AnGuLAR' }` (string parsing, no I/O)
- A `formatTokenCount(1234)` helper that returns `'1.2k'`
- A reducer that merges streamed message chunks into a final `ChatMessage` shape
- Cost calculation: `estimateRequestCost(tokens, model)` returning a number
- Schema validation: a Zod parser rejecting malformed tool-call payloads

*Smell — wrong layer:* if the test needs `mountSuspended`, `nextTick`, `useState`, or a fake fetch, it doesn't belong here.

**2. Nuxt component (`test/nuxt/`, `environment: 'nuxt'`, real browser via Playwright provider)**
Components, composables, and pages mounted via `mountSuspended` inside a real Chromium tab. Use this layer when the code touches reactivity, lifecycle, teleports, focus management, keyboard handling, or accessibility. Drive via real DOM events (`dispatchEvent(new KeyboardEvent(...))`, `element.click()`); query via `document.getElementById`, `getByRole`, accessible labels — never `wrapper.vm`.

*Good candidates:*
- A `useAgentChat` composable: send a message, assert the streamed assistant turn appears in the messages ref and the loading flag flips back
- `ChatSlideover` opens, traps focus, closes on `Escape`, and restores focus to the trigger
- `AppSearch` debounces input, renders results, and `ArrowDown` + `Enter` selects the highlighted item
- A tooltip component teleports into `document.body` and exposes the right `aria-describedby`
- An axe-core a11y assertion on `ChatEmptyState` with required props

*Smell — wrong layer:* if the test needs the Nitro server, real route navigation, or SSR-rendered HTML, push it up to e2e.

**3. E2E (`test/e2e/`, Playwright)**
Full app over real navigation. Verifies routing, SSR/hydration, server endpoints, and cross-page flows. Use `goto(url, { waitUntil: 'hydration' })` and assert against rendered DOM with `page.locator('text=...')` or `getByRole`. Image snapshots are pinned to Linux via Docker.

*Good candidates:*
- Open `/chat`, send a prompt, watch the streamed reply render token-by-token, then navigate away and back to confirm persistence
- The chat page hydrates without a Vue mismatch error in the console
- A protected route redirects unauthenticated users to login, then back to the original URL after auth
- Quota-exceeded server response surfaces a user-visible warning banner
- The app loads under a strict CSP — no violation messages in the console after a full session flow

*Smell — wrong layer:* if you're asserting against an internal ref, a single component's DOM in isolation, or a pure helper's output, drop down a layer.

If a test could pass at a lower layer, write it there. Reach upward only when the lower layer cannot prove the behavior.

## Patterns

**Harness for stateful flows.** When a component owns shared state (command palette, modals, slideovers), wrap it in a small harness component that exposes the composable to the test:

```ts
const Harness = defineComponent({
  setup() { palette = useCommandPalette(); /* ... */ }
})
```

The test mounts the harness, drives it via real events, and reads the live DOM. Selectors live in one helper (`mountPalette`, `flushPalette`); tests stay readable.

**Mock only at the network boundary.** External APIs are intercepted with `page.route()` and served from `test/fixtures/*.json`. An unmocked external request must throw a loud error — never silently hit production. Internal collaborators (composables, child components, stores) are *not* mocked.

**Fixture infrastructure is shared, not duplicated.** One `mock-routes.cjs` defines URL patterns and responses; Playwright e2e, Lighthouse audits, and SSR all consume it. Adding a fixture once unblocks every test layer.

**Mock servers honor the production contract.** When you need a stateful backend (auth, queues), run a real H3 server in tests that implements the same TypeScript interface as the production server, plus `/__test__/*` endpoints to seed state. The contract is enforced by the type system, so the mock cannot drift.

**Every component has an a11y test.** A coverage spec (`test/unit/a11y-component-coverage.spec.ts` in npmx) walks `app/components/` and fails if a component has neither an axe test nor an explicit skip with a reason. axe runs inside `mountSuspended` with page-level rules disabled. Lighthouse CI then audits full pages for the score axe cannot see.

**Console surveillance.** Tests fail on hydration mismatches, CSP violations, and unexpected `console.warn` calls. Allowed warnings live in an explicit regex array with comments explaining why each is benign. New noise is opt-in, not opt-out.

**Performance guardrails in CI.** Lighthouse CI asserts CLS = 0 on key pages. Layout-shift bugs are caught before merge, not after a Core Web Vitals regression in production.

## Anti-Patterns

- Reaching into `wrapper.vm` from a Nuxt component test — see [[test-behavior-not-implementation]]. The real DOM is the contract.
- `shallowMount` with stubbed children — you've tested a fiction.
- Mocking a composable to make a component test pass — fix the composable's seam (inject a port) or move the test to the layer that can run it for real.
- Fixture data inlined per test — fixtures belong in `test/fixtures/` so server-side, client-side, and Lighthouse share one source of truth.
- Snapshot tests over arbitrary DOM trees — they assert structure, not behavior, and rot into rubber-stamps. Image snapshots for *visual* regressions are fine; structural snapshots are not.
- Skipping a11y tests "for now" — the coverage spec exists to make this impossible. Either test it or document why it's exempt.

## Related

- [[test-behavior-not-implementation]] — how to assert (queries, drivers, anti-patterns at the test level)
- [[verify-in-the-browser]] — manual verification protocol for UI work
- [[prove-it-works]] — the verification mindset these layers operationalize
- [[boundary-discipline]] — why the network boundary is the right mock seam
