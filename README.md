# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

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
