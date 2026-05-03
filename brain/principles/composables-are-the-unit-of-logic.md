# Composables Are the Unit of Logic

In a Vue/Nuxt codebase, the composable is the default home for logic. Components render and wire events; composables hold reactive state, derived values, side effects, and the lifecycle around them. If a component is growing past presentation, the answer is almost always to extract a composable — not a util, not a service, not a mixin.

**Why:** Components mix three concerns (template, reactivity, lifecycle) and are awkward to test or reuse. Plain utility files lose reactivity. Composables keep reactivity intact, are trivial to unit-test in isolation, and compose without inheritance. Treating them as the primary abstraction collapses the question "where does this logic go?" into one answer.

**The Pattern:**
- One composable, one responsibility. `useUser`, `useCart`, `useDebouncedSearch` — not `useEverythingForCheckout`.
- Name with `use*`. The prefix is a contract: "this returns reactive state and may register lifecycle hooks; call it inside `setup`."
- Return a small, named object — `{ data, error, isLoading, refresh }`. Avoid returning tuples or anonymous arrays; named keys document the API.
- Push pure logic deeper. Inside the composable, factor business rules into pure functions that take values and return values. The composable wires reactivity around them; tests can hit the pure core without mounting anything.
- Clean up what you register. Watchers, intervals, event listeners, and subscriptions get torn down via `onScopeDispose` / `onWatcherCleanup`. A composable that leaks is a bug, not a feature.

**Component shape that follows from this:**
- `<script setup>` reads top-down: a few `useX()` calls, a couple of refs, handlers that delegate to the composables, `<template>`.
- If a component has more than ~15 lines of logic between `<script setup>` and `<template>`, that logic wants to be a composable.
- Props and emits are the component's only public API; composables are the only place internal state lives.

**Dumb components, state lifted up.** As many dumb prop-rendering components as possible; state lives one level up in the composable or store that owns the feature. A child that needs to compute or refetch is a smell — the parent should pass the resolved value down. This keeps components trivially testable, replaceable, and free of runtime guards. When deciding whether to add a `ref` to a component, ask: can the composable own this and the component receive it as a prop?

**Refactoring moves:**
- *Extract Composable* when the same reactive logic appears in two components, or when one component crosses the size threshold.
- *Inline Composable* when a `useX` is used in exactly one place and adds no clarity — collapse it back into the component.
- *Computed Inlining* when a `computed` is used once, trivially, and the inline expression reads more clearly.

**The Tests:**
- "Can I test this logic without mounting a component?" If no, it's still entangled — pull more into the composable, more into pure functions.
- "Does this composable do one thing I can name in five words?" If no, split it.

The "push pure logic deeper" pattern is [[boundary-discipline]] applied at component scope. Tests on the pure core follow [[test-behavior-not-implementation]] — assert on what the composable returns, not how it computes it.
