# Test Behavior, Not Implementation

Tests assert what the user observes — rendered output, accessible roles, network effects — never internal state, child component names, emitted-event plumbing, or method calls. The component is a black box; the test is its first user.

**Why:** Implementation-coupled tests break on refactors that don't change behavior, which trains teams to delete or weaken tests instead of trusting them. Behavior-coupled tests survive refactors and catch real regressions, because they fail only when the user-visible contract changes.

**The Pattern:**
- Query by accessible role, label, or text — the same handles a user (or screen reader) uses. Reach for `data-testid` only when no semantic handle exists.
- Drive the component through real interaction (`userEvent`, route navigation, form submission), not by setting `wrapper.vm` properties or calling exposed methods.
- Assert on rendered DOM and side effects (requests fired, store transitions visible to the UI) — not on internal refs, computed names, or which child component rendered.
- Mock only at the boundary (HTTP, time, randomness). Never mock collaborating composables or child components to make a test pass.

**Driver pattern:** When a flow recurs across tests (login, create-todo, navigate-to-settings), wrap the interactions in a driver — `driver.login()`, `driver.createTodo("milk")` — that hides selectors and steps. The test reads as a story; the driver is the only place that knows the DOM. Refactors update the driver, not 40 tests.

**The Tests:**
- "If I rewrote this component with the same UX, would the test still pass?" If no, it's coupled to implementation.
- "Could a screen reader user perform this assertion?" If no, the query is wrong.
- "Does the test name describe a user behavior or a code structure?" `renders correctly when prop changes` is a smell; `shows error message when email is invalid` is the target.

**Anti-Patterns:**
- Snapshot tests over DOM trees — they assert structure, not behavior, and rot into rubber-stamps.
- `expect(wrapper.emitted('update:modelValue'))` as the only assertion — test the *consequence* of the emit, not the emit itself.
- Mounting with `shallow` and stubbing children — you've now tested a fiction.
