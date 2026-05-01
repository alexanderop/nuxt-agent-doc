# Make Illegal States Unrepresentable

Use the type system to rule out states the runtime should never have. Discriminated unions over flag soup, `Result` over thrown-and-hoped, branded types over stringly-typed IDs, and never `as` to silence the compiler. If the types allow a bad state, you will eventually render it.

**Why:** Optional fields and boolean flags multiply: `isLoading | error | data | empty` as four independent properties has 16 combinations, of which maybe 4 are valid. Bugs live in the other 12. A discriminated union collapses that to exactly the states that exist. The compiler then refuses to let you render `data` while `isLoading` is true — not as a runtime check, but as a non-representable program.

**The Patterns:**

*Discriminated unions over flag soup:*
```ts
// Not this — 16 representable states, 4 valid
type State = { isLoading: boolean; error?: Error; data?: User; isEmpty: boolean }

// This — 4 representable states, 4 valid
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "success"; data: User }
```
Switch on `status`; TypeScript narrows the rest. No more `if (data && !isLoading && !error)`.

*Variant props for component APIs:*
- A `<Button>` that accepts `variant: "primary" | "secondary" | "link"` plus `href?: string` allows `variant: "primary"` with an `href`, which makes no sense. Discriminate the variant: `{ variant: "link"; href: string } | { variant: "primary"; onClick: () => void }`. The compiler enforces the right props for the chosen variant.

*Result over throw-and-catch for expected failures:*
- Network errors, validation failures, and parse errors are *expected* outcomes, not exceptions. Return `Result<T, E>`. Callers must handle both branches — the compiler won't let them forget.
- Reserve `throw` for genuinely exceptional, programmer-error situations (invariant violated, unreachable code).

*Branded types for identifiers:*
- `type UserId = string & { readonly __brand: "UserId" }` prevents passing a `PostId` where a `UserId` is expected. Cheap to add, catches whole classes of bug.

*No `as` as a shortcut:*
- `as` says "trust me, compiler." It usually means the data shape doesn't actually match — and the runtime will eventually disagree.
- Replace with: a parser at the boundary (Zod, Valibot, hand-rolled), a type guard (`function isUser(x: unknown): x is User`), or fixing the upstream type.
- Acceptable uses: narrowing within a discriminated union after a check the compiler can't see, `as const` for literal preservation, test fixtures where the shape is obvious. Anywhere else it's a code smell.

**The Tests:**
- "How many states does this type allow? How many are valid?" If those numbers differ, redesign.
- "If I delete this `as`, what breaks?" If the answer is "the types," the types are wrong, not the assertion.
- "Could a caller forget to handle the failure case?" If yes, switch from throwing to `Result`.

**Boundary discipline corollary:** The boundary is where you parse `unknown` into a strict type. Once parsed, the type is trusted everywhere downstream — no re-validation, no defensive checks, no `as`.
