# Compose Parts, Don't Configure Them

When a component grows variants, ship small parts the consumer arranges into a tree. Don't add boolean props (`showHeader`, `mode`, `showFooter`) that branch on *what* renders. The arrangement of children **is** the variant; nothing inside the component should decide it.

**Why:** The two failure modes converge on the same pain. Copy a monolith per variant and the shells drift — every change needs N edits, kept in sync by grep and discipline. Collapse them into one god component and the props turn into `mode`, `showHeader`, `showCancel`, `confirmVariant`, `headerCentered` — the flag set grows every time a designer wants something new, and the call site needs twelve flags to describe one shape. Both routes leak the variant decision into the component. Compound parts move that decision to the call site, where it belongs.

**The diagnostic — "what" vs "how" props:**
- A prop that changes *how* something renders (size, color, density) is fine flat: `<Button variant="destructive" size="sm" />`.
- A prop that changes *what* renders (`mode="edit"`, `showFooter`, `showCloseIcon`) is a composition opportunity. Lift it into a child the consumer chooses to include or omit.

**The pattern:**
- **Provider holds state.** A Pinia store, a `provide`/`inject` pair, or a composable that bundles refs. Children read what they need from the provider — no prop drilling, no callback threading.
- **Each child is small and dumb.** Reads only the slice of context it uses, renders one piece of markup, owns no business logic. `<DialogTrigger>`, `<DialogContent>`, `<DialogClose>` — not `<Dialog showTrigger showContent />`.
- **Tree shape = variant.** The consumer composes the parts they need. A confirm dialog drops the description; a share dialog adds an icon close in the corner; an edit dialog puts the form inside `<DialogContent>` so `v-model` binds to the consumer's state without crossing the component boundary.
- **Convenience layers wrap the primitive, never extend it.** When a flat `<ConfirmDialog title="..." />` is justified, build it as a *consumer* of the parts. Adding flags back onto the primitive is how the compound API collapses into the boolean-prop monolith you started with.

**In Vue specifically:**
- A Pinia store often plays the provider role for free. Each compound part calls `useXStore()` directly. No `InjectionKey` needed unless state is genuinely component-scoped (an `<Accordion>` with multiple instances on the page).
- Use [Fallthrough Attributes](https://vuejs.org/guide/components/attrs) so the consumer can pass `class`, `compact`, etc. to the wrapped primitive without a prop forwarding shim.
- For genuinely component-scoped state, prefer VueUse's `createInjectionState` over hand-rolled `provide`/`inject` — it makes the state machine unit-testable without mounting.

**When to apply:**
- Three real call sites with diverging shapes — one is a component, two is a coincidence, three is a pattern.
- A component is collecting boolean props faster than features ship.
- You catch yourself copy-pasting a shell across files (the duplicated `border-t border-default` wrappers, the rebuilt overlay+footer markup).

**When not to apply:**
- The component has one shape and you're inventing variants that don't exist (`<UserAvatar size="md" src="..." />` is fine flat).
- Consumers are LLM-generated code or external API users who benefit from a flat, predictable signature.
- State is trivial — `provide`/`inject` ceremony for one boolean is worse than the boolean.

**The Tests:**
- "Does this prop change what renders, or how it renders?" If "what," lift it.
- "If I delete this prop, can the consumer express the same variant by arranging children?" If yes, delete the prop.
- "Are two consumers rebuilding the same shell?" Extract the shared parts; let the unique chrome stay in each consumer.

**Concrete in this codebase:** `ChatComposer` and `ChatMessages` were extracted from `ChatSlideover.vue` and `pages/chat.vue` — both rebuilt the same `UChatPrompt` + `ChatPromptFooter` + rate-limit fallback block, both rebuilt the same `UChatMessages` + slot wiring. The Pinia `useAgentChatStore` is the provider; each part reads the store directly. The slideover and the page each describe their variant by *arranging* the parts inside their own outer chrome. Neither file flags what to render anymore — the tree shape does.

Connects to [[composables-are-the-unit-of-logic]] (provider state lives in the store/composable, parts are dumb), [[make-illegal-states-unrepresentable]] (boolean-prop sprawl encodes invalid combinations the type system can't rule out — composition removes the combinations), and [[subtract-before-you-add]] (every `showX` prop is something a future change has to remove).
