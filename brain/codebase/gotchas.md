# Codebase Gotchas

Project-specific things that have cost real time. Check here before guessing.

## Nuxt + Vite 7

**Stack overflow in transforms.** `Maximum call stack size exceeded ... at EnvironmentPluginContainer.transform` is fixed by `experimental.viteEnvironmentApi: true` in `nuxt.config.ts`. Without it Nuxt feeds Vite 7 through a compatibility shim that recurses. Already set — don't remove.

**Nitro payload-cache `ENOTDIR`.** The home page (`/`) gets cached at base path `.nuxt/cache/nuxt/payload` (as a file), then blocks subsequent writes to `payload/<child>`. Fixed by `nitro.devStorage: { 'cache:nuxt:payload': { driver: 'memory' } }` in `nuxt.config.ts` — already in place. If you still see this on a stale checkout, `rm -rf .nuxt/cache` while the dev server is stopped.

## Nuxt Content v3

**No `CONTAINS` SQL operator.** Spec docs and AI completions both lie about this. The valid operators do not include `CONTAINS`. To match a value inside a JSON-serialized array column (e.g. `tags`), use:

```ts
.where('tags', 'LIKE', '%"vue"%')
```

**Schema changes need a dev-server restart.** HMR does not pick up `content.config.ts` edits.

**`rawbody` is real but expensive.** Adding `rawbody: z.string()` to a collection schema auto-populates the raw markdown (frontmatter included — strip it if you render the header separately). MCP list-tools that don't use `rawbody` should `.select(...)` to avoid loading multi-KB bodies per row.

## @nuxtjs/mcp-toolkit

- `handler(input)` takes **one** arg. Get the H3 event via `useEvent()`, not a 2nd handler arg.
- `inputSchema` is a **raw shape** (`{ tag: z.string() }`), not `z.object({...})`.
- Handler return values auto-wrap to `{ content: [{ type: 'text', text }] }`. Strings pass through; objects/arrays get JSON-stringified.
- `useEvent()` inside handlers requires `nitro.experimental.asyncContext: true`.
- Auto-discovery picks up `server/mcp/tools/*.ts`. No `transports` config key — http is default.

## Streaming Markdown

`<MDC>` from `@nuxtjs/mdc` does not work in streaming chat — its async setup means `<Suspense>` doesn't replay on text updates. Use `@comark/nuxt`: `defineComarkComponent` with `highlight()` plugin and a `components` map for custom slot components. This is also why Vercel ships `streamdown`.

## AI SDK v6

- **Default routing is Vercel AI Gateway.** Model strings like `'anthropic/claude-sonnet-4.6'` route through the gateway and need `AI_GATEWAY_API_KEY`. For direct Anthropic, install `@ai-sdk/anthropic` and use `anthropic('claude-sonnet-4-6')` with `ANTHROPIC_API_KEY`. We use direct.
- **`stepCountIs(MAX_STEPS)`** replaces hand-rolled `stopWhen` callbacks. `streamText` already terminates on a step with no tool calls — don't duplicate that.
- **`convertToModelMessages` is async** in `ai@6.x` despite older Context7 snapshots showing it sync. Verify against the installed version when SDK majors land.

## Tooling

- **pnpm only.** A pre-commit hook blocks `npm`. Use `pnpm` / `npx`.
- **`as const` is exempt from `consistent-type-assertions`** with `assertionStyle: 'never'`. Don't replace `as const` literal arrays with `Set` to dodge the rule — it never fired on them. Pattern: `as const` + a `is*` predicate when narrowing is needed.

## Related

- [[agent-chat-architecture]]
- [[code-mode]]
- [[../principles/trust-real-code-over-spec]] — Nuxt Content `CONTAINS`, AI SDK `convertToModelMessages` async: spec docs and AI completions both lie about these; the installed package wins.
- [[../principles/encode-lessons-in-structure]] — the pre-commit hook blocking `npm` is the canonical local example.
