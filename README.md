# nuxt-agent-doc

A Nuxt 4 blog with an AI chat agent layered on top — a minimalist reproduction of the `nuxt.com` documentation agent, applied to a personal blog. The chat slideover is available on every page and uses an `x-page-path` header so questions like "tldr this" answer in the context of whichever post the reader has open.

**Stack:** Nuxt 4 · Nuxt UI v4 · Nuxt Content 3 · Vercel AI SDK · Anthropic Claude · Drizzle + libSQL/Turso · MCP toolkit · evalite.

## Setup

Requires Node ≥ 22 and pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Production

```bash
pnpm build
pnpm preview
```

See the [Nuxt deployment docs](https://nuxt.com/docs/getting-started/deployment).

## Environment variables

Copy `.env.example` to `.env` and fill in:

- `ANTHROPIC_API_KEY` — required, Claude API key for the chat agent.
- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` — leave unset to use a local `./local.db` (default for development).
- `NUXT_CRON_SECRET` — Bearer token gating `/api/agent/cleanup`. Set to any random string locally.

## Database

```bash
pnpm db:generate   # emit a migration after changing server/db/schema.ts
pnpm db:migrate    # apply migrations
pnpm db:studio     # open drizzle-kit studio
```

## Cleanup

`/api/agent/cleanup` deletes chats older than 30 days and rate-limit rows older than 7 days. It is Bearer-gated; run manually against the dev server:

```bash
pnpm db:cleanup
```

## Evals

`test/mcp.eval.ts` runs an [evalite](https://v1.evalite.dev) suite that grades whether a smaller model (Claude Haiku) routes natural-language questions to the correct MCP tool. It catches silent regressions in tool descriptions or schemas before they reach production.

```bash
pnpm dev               # one terminal — must be running so /mcp is reachable
pnpm eval              # other terminal — opens the evalite UI in watch mode
pnpm eval:run          # one-shot, exits 1 below an 80% average score
```

The CI `eval` job builds the production bundle, boots `.output/server`, and runs `pnpm eval:run`. It is gated as `continue-on-error` for now — scores show up as a signal without blocking PRs.
