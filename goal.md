# Spec — `nuxt-agent-from-scratch`

A minimalist reproduction of the Nuxt documentation agent (`nuxt.com`) **plus a full working blog** for [alexop.dev](https://alexop.dev) — built with the Nuxt + Nuxt UI stack. After Phase 2 you have a deployable blog with no AI yet. After Phase 5 you have that same blog with a chat assistant slideover available on every page. The repo is **the tutorial** — each phase ships as one commit + one README section.

> **Audience:** mid‑level dev shipping their first AI feature, OR junior dev who knows Vue/Nuxt and wants to learn the agent pattern. No prior AI SDK experience required.
>
> **Time:** ~10–14 hours total. Phases 0–2 (working blog, no AI) ≈ first day. Phases 3–5 (blog + working chat) ≈ second day.
>
> **Reference repos on disk** — keep these open in a second editor window while building:
> - **`~/Projects/opensource/nuxt.com`** — the architecture we're reproducing (agent endpoint, MCP server, drizzle schema, evals). Copy verbatim where it makes sense; cite paths in commits so readers can compare.
> - **`~/Projects/opensource/npmx.dev`** — Alex's other production Nuxt project, with a *much* more thorough testing & quality strategy than we need on day one. Use it as the upgrade path when we want to harden the agent later. Specific files worth reading: `package.json` scripts, `.github/workflows/ci.yml`, `.github/workflows/semantic-pull-requests.yml`, `.github/workflows/chromatic.yml`, `scripts/lighthouse.sh`, `playwright.config.ts`, `knip.ts`.
>
> **Blog content source on disk** — `~/Projects/content/blog-astro/src/content/`:
> - `blog/` — 113 `.mdx` posts (frontmatter: `title`, `description`, `pubDatetime`, `tags`, `draft`, `seriesTag?`, …).
> - `notes/` — 2 `.mdx` book/article reviews (`sourceType`, `sourceAuthor`, `rating?`, `highlights[]`, …).
> - `til/` — 9 `.mdx` "today I learned" snippets.
>
> The Astro schema we're matching lives at `~/Projects/content/blog-astro/src/content.config.ts` — refer to it whenever the Nuxt Content zod schemas in §6 look ambiguous.

---

## 1. Goal & non‑goals

**Goal.** Two things at once, in this order:

1. **A complete, deployable Nuxt blog** for alexop.dev's content, styled with Nuxt UI v4 — list pages, post pages, tag filtering, RSS, color mode, the lot. Working without any AI by end of Phase 2.
2. **A reproduction of Nuxt's documentation agent** layered on top — a chat slideover triggered from any page, with the page‑context trick (so "explain this" works on whichever post the reader has open). Working by end of Phase 5.

End‑state UX: visitor lands on `/`, browses `/blog`, opens `/blog/atomic`, hits "Ask my blog" in the header → slideover opens → asks "tldr this" → the agent already knows the current page from the `x-page-path` header and answers in place.

**Non‑goals.**
- Multi‑user auth, accounts, admin dashboards.
- Web search, GitHub issues, playground links.
- Localisation beyond English.
- Custom design system. Use Nuxt UI defaults — readability over aesthetics.
- Comments, newsletter signup, deep analytics.

If you're tempted to add scope, write it as a Phase 10+ note instead.

---

## 2. Working rhythm — phase‑gated review

This spec is structured for the following collaboration rhythm. **Read this section twice.**

### How a phase is delivered

1. **You (the junior dev) implement *one* phase from this spec.** Don't merge work from two phases into a single PR.
2. **You open a PR** with the commit message specified at the bottom of the phase. The PR title matches.
3. **You stop.** Don't start the next phase. Don't pre‑optimise. Don't refactor neighbouring code.
4. **Alex reviews the PR.** Expect comments; address them in the same PR.
5. **PR merges.** Only then do you start the next phase.

### What this means in practice

- Each phase has a **🛑 Stop block** at the end with the exact PR branch name, what Alex is going to check, and a reminder not to start the next phase.
- If a phase blocks on something out‑of‑scope (e.g. you need a Turso account for Phase 7), say so in the PR — don't invent workarounds.
- If a phase feels too small, that's correct. Small phases let Alex catch architecture mistakes early. A 30‑file PR that touches 5 phases is not faster — it's unreviewable.
- If a phase feels too large, split it and call it "Phase 3a / 3b" in the PR title. Better to over‑split than under‑split.

### What goes in every PR

- ✅ The acceptance‑criteria checklist from the phase, copied into the PR body, with each item ticked off.
- ✅ A short note: "Tested by …" — what command(s) you actually ran.
- ✅ Any new env vars added to `.env.example`.
- ✅ Screenshots if there's a UI change.
- ❌ No code from a future phase. Even if it's "just a stub."
- ❌ No `// TODO: revisit in phase X` comments. If a phase ends with a TODO, the phase isn't done.

### Branch naming

```
feat/phase-0-quality-gate
feat/phase-1-content-migration
feat/phase-2-blog-ui
feat/phase-3-mcp-server
feat/phase-4-agent-endpoint
feat/phase-5-chat-slideover
feat/phase-6-show-post
feat/phase-7-persistence
feat/phase-8-hygiene
feat/phase-9-evals
feat/phase-10-polish
```

This is the only correct cadence. Don't bikeshed it.

---

## 3. Locked stack decisions

These are decided. Don't bikeshed.

| Concern | Choice | Why |
|---|---|---|
| Framework | **Nuxt 4** | Same as nuxt.com |
| UI | **`@nuxt/ui` v4** | What nuxt.com uses; gives us `<UButton>`, `<UCard>`, `<USlideover>`, `<UChatMessages>`, `<UChatPrompt>` |
| Content | **`@nuxt/content` v3** | Mirrors how nuxt.com loads its docs/blog |
| MCP | **`@nuxtjs/mcp-toolkit`** | Same package as nuxt.com |
| AI SDK | **`ai` v6** + **`@ai-sdk/vue`** + **`@ai-sdk/mcp`** | v6 is the stable line; matches nuxt.com |
| Provider | **AI Gateway** via plain string IDs (`anthropic/claude-sonnet-4.6`) | Per Vercel default; one env var (`AI_GATEWAY_API_KEY`) |
| DB | **libSQL** (`@libsql/client`) — local file in dev, **Turso** in prod | Stays SQLite (same dialect as nuxt.com), no Cloudflare/NuxtHub lock‑in. nuxt.com itself ships `@libsql/client` in deps. |
| ORM | **Drizzle** (`drizzle-orm/libsql` adapter) + **drizzle‑kit** for migrations | Same as nuxt.com |
| Lint | **oxlint** (fast pre‑commit) **+ ESLint** (`@nuxt/eslint`, full ruleset) | oxlint per user request; ESLint matches nuxt.com config |
| Types | **vue‑tsc** strict | Catches errors before runtime |
| Pre‑commit | **lefthook** | Lighter than husky, single binary |
| CI | **GitHub Actions** | Free, standard |
| Evals | **evalite** | Same as nuxt.com |
| Package manager | **pnpm** (corepack‑pinned) | Matches nuxt.com |
| Node | **22 LTS** | Matches nuxt.com |
| Hosting | **Vercel** | Matches nuxt.com |

---

## 4. Repo layout (target end‑state)

```
nuxt-agent-from-scratch/
├── README.md                          # Tutorial: each phase = one section
├── .github/workflows/ci.yml           # lint + typecheck + eval gate
├── .github/workflows/semantic-pull-requests.yml
├── .lefthook.yml                      # pre-commit: oxlint + typecheck
├── eslint.config.mjs                  # @nuxt/eslint flat config
├── nuxt.config.ts                     # mcp, content, ui modules
├── content.config.ts                  # blog/notes/til collections (zod)
├── drizzle.config.ts                  # drizzle-kit config (libsql)
├── content/
│   ├── blog/                          # 113 .md (migrated from astro repo)
│   ├── notes/                         # 2 .md
│   └── til/                           # 9 .md
├── app/
│   ├── app.vue                        # <UApp> + <NuxtLayout>
│   ├── layouts/
│   │   └── default.vue                # AppHeader + slot + AppFooter + ChatSlideover
│   ├── pages/
│   │   ├── index.vue                  # landing (recent posts, hero)
│   │   ├── blog/
│   │   │   ├── index.vue              # paginated post list
│   │   │   └── [...slug].vue          # individual post
│   │   ├── notes/
│   │   │   ├── index.vue              # list of book/article notes
│   │   │   └── [...slug].vue
│   │   ├── til/
│   │   │   ├── index.vue              # TIL list
│   │   │   └── [...slug].vue
│   │   └── tags/[tag].vue             # posts filtered by tag
│   ├── components/
│   │   ├── app/
│   │   │   ├── AppHeader.vue          # nav + ColorMode + Ask-my-blog button
│   │   │   └── AppFooter.vue
│   │   ├── content/
│   │   │   ├── PostListItem.vue       # card for blog list
│   │   │   ├── PostMeta.vue           # date + tags + author row
│   │   │   └── TagBadge.vue
│   │   ├── chat/
│   │   │   ├── ChatSlideover.vue      # USlideover wrapping the chat
│   │   │   └── ChatContent.vue        # message renderer w/ tool switch
│   │   └── tools/
│   │       └── PostCard.vue           # rendered when show_post fires
│   └── composables/
│       ├── useChatSlideover.ts        # global open/close state
│       └── useAgentChat.ts            # Chat instance + chatId + page context
├── server/
│   ├── api/
│   │   ├── agent.post.ts              # streaming endpoint
│   │   └── agent/cleanup.get.ts       # daily cron
│   ├── routes/
│   │   └── rss.xml.ts                 # RSS feed
│   ├── mcp/
│   │   └── tools/
│   │       ├── list-blog-posts.ts
│   │       ├── get-blog-post.ts
│   │       ├── list-notes.ts
│   │       ├── get-note.ts
│   │       ├── list-tils.ts
│   │       └── get-til.ts
│   ├── utils/
│   │   ├── tools/show-post.ts         # native UI tool (NOT an MCP tool)
│   │   ├── agent-fingerprint.ts
│   │   ├── rate-limit.ts
│   │   └── system-prompt.ts
│   └── db/
│       ├── client.ts
│       ├── schema.ts
│       └── migrations/
├── scripts/
│   └── migrate-mdx.ts                 # one-off: astro mdx → nuxt content md
├── test/
│   └── mcp.eval.ts                    # evalite suite
├── evalite.config.ts
├── vercel.json                        # cron: cleanup at 03:00 UTC
├── package.json
└── tsconfig.json
```

---

## 5. Phase 0 — Quality gate (set up FIRST, before any feature work)

**Why first?** A junior dev adds quality gates last and ends up with 200 ESLint warnings to fix at PR time. Set them up before there's any code, and every commit lands clean.

> **Borrow from `~/Projects/opensource/npmx.dev`** for the gate setup — it's the most polished CI in the reference repos:
> - **CI workflow** — `.github/workflows/ci.yml` (lint + types + unit + browser, parallel jobs).
> - **Semantic PR titles** — `.github/workflows/semantic-pull-requests.yml`. Add this from day one; it forces conventional commits in PR titles.
> - **Auto‑fix bot** — `.github/workflows/autofix.yml` runs `lint --fix` on PRs.
> - **knip for dead‑code detection** — `knip.ts` + `pnpm knip:fix`.
> - **Playwright build → preview → test pattern** — model later browser evals after this.
> - **Lighthouse a11y/perf** — `scripts/lighthouse.sh`.
>
> Don't copy *all* of npmx.dev's tooling — that repo is a multi‑year prod project. Pick CI + semantic PRs + knip for now; add the rest on demand.

### Phase 0 deliverables

1. **Init repo + Nuxt 4 skeleton.**
   ```bash
   pnpm dlx nuxi@latest init nuxt-agent-from-scratch
   cd nuxt-agent-from-scratch
   git init && git add -A && git commit -m "chore: nuxt 4 skeleton"
   ```

2. **Pin Node + pnpm via corepack.**
   ```jsonc
   // package.json
   { "packageManager": "pnpm@10.33.2", "engines": { "node": ">=22.0.0" } }
   ```
   `corepack enable && corepack prepare pnpm@10.33.2 --activate`

3. **Install Nuxt UI v4 + ESLint module.**
   ```bash
   pnpm add @nuxt/ui
   pnpm add -D @nuxt/eslint @nuxt/eslint-config eslint typescript vue-tsc
   ```
   Add `'@nuxt/ui'` and `'@nuxt/eslint'` to `nuxt.config.ts` `modules`. Wrap `app.vue` in `<UApp>`.

4. **ESLint flat config** — copy nuxt.com's verbatim:
   ```ts
   // eslint.config.mjs
   import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
   export default createConfigForNuxt({
     features: { tooling: true, stylistic: { commaDangle: 'never', braceStyle: '1tbs' } }
   }).overrideRules({
     'import/first': 'off', 'import/order': 'off',
     'vue/multi-word-component-names': 'off',
     'vue/max-attributes-per-line': ['error', { singleline: 5 }],
     '@typescript-eslint/no-explicit-any': 'off'
   })
   ```

5. **oxlint as fast pre‑commit pass.**
   ```bash
   pnpm add -D oxlint
   ```
   ```jsonc
   // .oxlintrc.json
   {
     "rules": {
       "no-debugger": "error",
       "no-console": ["warn", { "allow": ["warn", "error"] }]
     },
     "ignorePatterns": [".nuxt/**", ".output/**", "node_modules/**", "dist/**"]
   }
   ```

6. **Lefthook pre‑commit.**
   ```bash
   pnpm add -D lefthook && pnpm lefthook install
   ```
   ```yml
   # .lefthook.yml
   pre-commit:
     parallel: true
     commands:
       oxlint:    { glob: "*.{ts,tsx,vue,js,mjs}", run: "pnpm oxlint {staged_files}" }
       typecheck: { run: "pnpm typecheck" }
   pre-push:
     commands:
       eslint: { run: "pnpm lint" }
   ```

7. **package.json scripts** (mirror nuxt.com):
   ```jsonc
   {
     "scripts": {
       "dev": "nuxt dev",
       "build": "nuxt build",
       "preview": "nuxt preview",
       "postinstall": "nuxt prepare",
       "lint": "eslint . --cache",
       "lint:fast": "oxlint",
       "typecheck": "nuxt typecheck",
       "test:types": "vue-tsc -b --noEmit",
       "eval": "evalite",
       "test": "pnpm lint && pnpm test:types"
     }
   }
   ```

8. **GitHub Actions CI** — `.github/workflows/ci.yml` runs `lint`, `typecheck`, `test:types` on every PR. Use `actions/setup-node@v4` with `cache: 'pnpm'`.

9. **Semantic PR titles** — copy `.github/workflows/semantic-pull-requests.yml` from npmx.dev.

10. **`.editorconfig` + `.gitignore`** — copy from nuxt.com. `.gitignore` must include `local.db*`, `.env`, `.data/`, `.output/`, `.nuxt/`.

### Phase 0 acceptance criteria
- [ ] `pnpm dev` starts Nuxt and renders the default page wrapped in `<UApp>`.
- [ ] `pnpm lint` exits 0.
- [ ] `pnpm typecheck` exits 0.
- [ ] `git commit` runs oxlint + typecheck via lefthook (try a `console.log` — it warns).
- [ ] First PR is green on CI.
- [ ] PR title format is enforced (try a non‑conventional title — it fails).

**Commit:** `chore: scaffold nuxt 4 + quality gate (oxlint, eslint, lefthook, ci)`

### 🛑 Stop. Open PR. Wait for Alex.
- **Branch:** `feat/phase-0-quality-gate`
- **What Alex will check:** the lefthook hook actually fires, the CI workflow file syntax is valid, all the scripts in `package.json` work end‑to‑end, the ESLint config doesn't accidentally lint `.nuxt/`.
- **Don't start Phase 1 until this PR is merged.**

---

## 6. Phase 1 — Content migration

The blog lives at `~/Projects/content/blog-astro/src/content/` with **113 `.mdx` blog posts, 2 `.mdx` notes, 9 `.mdx` TILs**. They use Astro components (`<InternalLink>`, `<Alert>`, `<Mermaid>`, etc.) that won't render in Nuxt Content. Strip them with a one‑off script.

### 6.1 Define collections

```ts
// content.config.ts
import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        author: z.string().default('Alexander Opalic'),
        pubDatetime: z.coerce.date(),
        modDatetime: z.coerce.date().optional(),
        tags: z.array(z.string()).default([]),
        draft: z.boolean().default(false),
        ogImage: z.string().optional(),
        seriesTag: z.string().optional(),
        seriesTitle: z.string().optional()
      })
    }),
    notes: defineCollection({
      type: 'page',
      source: 'notes/**/*.md',
      schema: z.object({
        title: z.string(),
        author: z.string().default('Alexander Opalic'),
        pubDatetime: z.coerce.date(),
        sourceType: z.enum(['book', 'video', 'article', 'podcast', 'other']),
        sourceAuthor: z.string(),
        sourceUrl: z.string().url().optional(),
        cover: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        tags: z.array(z.string()).default([]),
        description: z.string(),
        draft: z.boolean().default(false)
      })
    }),
    til: defineCollection({
      type: 'page',
      source: 'til/**/*.md',
      schema: z.object({
        title: z.string(),
        author: z.string().default('Alexander Opalic'),
        pubDatetime: z.coerce.date(),
        tags: z.array(z.string()).default([]),
        description: z.string().optional(),
        draft: z.boolean().default(false)
      })
    })
  }
})
```

### 6.2 Migration script

```ts
// scripts/migrate-mdx.ts
// usage: pnpm tsx scripts/migrate-mdx.ts
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const SRC = '/Users/alexanderopalic/Projects/content/blog-astro/src/content'
const DST = './content'
const COLLECTIONS = ['blog', 'notes', 'til'] as const

for (const c of COLLECTIONS) {
  const srcDir = join(SRC, c)
  const dstDir = join(DST, c)
  await mkdir(dstDir, { recursive: true })

  for (const f of await readdir(srcDir)) {
    if (!/\.(mdx?)$/.test(f)) continue
    const raw = await readFile(join(srcDir, f), 'utf8')
    const cleaned = raw
      .replace(/^import .+from .+;\s*$/gm, '')
      .replace(/<InternalLink\s+slug="([^"]+)">([^<]+)<\/InternalLink>/g, '[$2](/blog/$1)')
      .replace(/<Alert[^>]*>([\s\S]*?)<\/Alert>/g, '> $1')
      .replace(/<Aside[^>]*>([\s\S]*?)<\/Aside>/g, '> $1')
      .replace(/<([A-Z][A-Za-z]+)[^>]*>([\s\S]*?)<\/\1>/g, '$2')
      .replace(/<([A-Z][A-Za-z]+)\s*\/>/g, '')
      .replace(/\n{3,}/g, '\n\n')

    await writeFile(join(dstDir, f.replace(/\.mdx$/, '.md')), cleaned)
    console.log(`✓ ${c}/${f}`)
  }
}
```

Run once. Commit the resulting `content/` dir + the script. Don't render UI yet — that's Phase 2.

### Phase 1 acceptance criteria
- [ ] `content/blog/` has ~113 `.md` files; `content/notes/` has 2; `content/til/` has 9.
- [ ] No `.mdx` files in `content/` (script converted them all).
- [ ] No leftover `import …` lines in any migrated file (`grep -r "^import " content/` returns nothing).
- [ ] `pnpm typecheck` clean (zod schemas validate the frontmatter).
- [ ] `pnpm dev` starts without errors. Nuxt Content has indexed all the files.

**Commit:** `feat: migrate alexop.dev content from astro mdx to nuxt content`

### 🛑 Stop. Open PR. Wait for Alex.
- **Branch:** `feat/phase-1-content-migration`
- **What Alex will check:** the migration script's component‑stripping regexes don't mangle anything important (random `<` characters in code blocks should survive); frontmatter schemas match the Astro source; large content commit doesn't include any `node_modules` or build output.
- **Don't start Phase 2 until this PR is merged.**

---

## 7. Phase 2 — Blog UI (a complete blog with no AI yet)

By the end of this phase you can deploy the site to Vercel and it's a fully functional, styled blog. **No AI code lands in this phase.** The chat slideover, MCP server, and agent endpoint all come later.

### 7.1 Layout — header, footer, color mode

```vue
<!-- app/app.vue -->
<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
```

```vue
<!-- app/layouts/default.vue -->
<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
    <!-- ChatSlideover lands in Phase 5 -->
  </div>
</template>
```

```vue
<!-- app/components/app/AppHeader.vue -->
<script setup lang="ts">
const links = [
  { label: 'Blog', to: '/blog' },
  { label: 'Notes', to: '/notes' },
  { label: 'TIL', to: '/til' }
]
</script>

<template>
  <header class="border-b border-default sticky top-0 bg-default/80 backdrop-blur z-10">
    <UContainer class="flex items-center justify-between py-3">
      <NuxtLink to="/" class="font-semibold text-lg">alexop.dev</NuxtLink>
      <nav class="flex items-center gap-1">
        <UButton v-for="l in links" :key="l.to" :to="l.to" variant="ghost" color="neutral">
          {{ l.label }}
        </UButton>
      </nav>
      <div class="flex items-center gap-2">
        <UColorModeButton />
        <!-- "Ask my blog" button lands in Phase 5 -->
      </div>
    </UContainer>
  </header>
</template>
```

```vue
<!-- app/components/app/AppFooter.vue -->
<template>
  <footer class="border-t border-default py-8 text-sm text-muted">
    <UContainer class="flex justify-between">
      <span>© {{ new Date().getFullYear() }} Alexander Opalic</span>
      <NuxtLink to="/rss.xml" class="hover:text-default">RSS</NuxtLink>
    </UContainer>
  </footer>
</template>
```

### 7.2 Landing page

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
const { data: recent } = await useAsyncData('recent-posts', () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .order('pubDatetime', 'DESC')
    .limit(5)
    .all()
)

useHead({ title: 'Alexander Opalic — alexop.dev' })
</script>

<template>
  <UContainer class="py-16 max-w-2xl">
    <h1 class="text-4xl font-semibold mb-4">Hi, I'm Alex.</h1>
    <p class="text-lg text-muted mb-12">
      I write about Vue, Nuxt, AI, and how I work.
    </p>
    <h2 class="text-sm font-medium uppercase tracking-wide text-muted mb-4">Recent posts</h2>
    <ul class="space-y-4">
      <li v-for="p in recent" :key="p.path">
        <PostListItem :post="p" />
      </li>
    </ul>
    <UButton to="/blog" variant="ghost" trailing-icon="i-lucide-arrow-right" class="mt-6">
      All posts
    </UButton>
  </UContainer>
</template>
```

### 7.3 Reusable list item + meta

```vue
<!-- app/components/content/PostListItem.vue -->
<script setup lang="ts">
defineProps<{ post: { title: string, description: string, path: string, pubDatetime: Date, tags: string[] } }>()
</script>

<template>
  <NuxtLink :to="post.path" class="block group">
    <div class="text-xs text-muted">
      {{ new Date(post.pubDatetime).toLocaleDateString('en-US', { dateStyle: 'medium' }) }}
    </div>
    <div class="text-lg font-medium group-hover:text-primary transition">{{ post.title }}</div>
    <p class="text-sm text-muted line-clamp-2">{{ post.description }}</p>
  </NuxtLink>
</template>
```

```vue
<!-- app/components/content/PostMeta.vue -->
<script setup lang="ts">
defineProps<{ pubDatetime: Date, tags: string[], author?: string }>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
    <span>{{ new Date(pubDatetime).toLocaleDateString('en-US', { dateStyle: 'long' }) }}</span>
    <span v-if="author" class="hidden sm:inline">·</span>
    <span v-if="author" class="hidden sm:inline">{{ author }}</span>
    <div class="flex flex-wrap gap-1">
      <UBadge v-for="t in tags" :key="t" :to="`/tags/${t}`" variant="soft" size="sm">{{ t }}</UBadge>
    </div>
  </div>
</template>
```

### 7.4 List pages — `/blog`, `/notes`, `/til`

```vue
<!-- app/pages/blog/index.vue -->
<script setup lang="ts">
const { data: posts } = await useAsyncData('all-posts', () =>
  queryCollection('blog').where('draft', '=', false).order('pubDatetime', 'DESC').all()
)
useHead({ title: 'Blog — alexop.dev' })
</script>

<template>
  <UContainer class="py-12 max-w-2xl">
    <h1 class="text-3xl font-semibold mb-8">Blog</h1>
    <ul class="space-y-6">
      <li v-for="p in posts" :key="p.path">
        <PostListItem :post="p" />
      </li>
    </ul>
  </UContainer>
</template>
```

Mirror the same shape for `app/pages/notes/index.vue` (show `sourceType` + `rating` star count) and `app/pages/til/index.vue`.

### 7.5 Post pages — `/blog/[...slug]`, `/notes/[...slug]`, `/til/[...slug]`

```vue
<!-- app/pages/blog/[...slug].vue -->
<script setup lang="ts">
const route = useRoute()
const { data: post } = await useAsyncData(route.path, () =>
  queryCollection('blog').where('path', '=', route.path).first()
)
if (!post.value) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

useHead({
  title: `${post.value.title} — alexop.dev`,
  meta: [{ name: 'description', content: post.value.description }]
})
</script>

<template>
  <UContainer class="py-12 max-w-2xl">
    <article>
      <h1 class="text-4xl font-semibold mb-3">{{ post.title }}</h1>
      <PostMeta
        :pub-datetime="post.pubDatetime"
        :tags="post.tags"
        :author="post.author"
        class="mb-10"
      />
      <ContentRenderer :value="post" class="prose dark:prose-invert max-w-none" />
    </article>
  </UContainer>
</template>
```

Notes pages additionally render `sourceType`, `sourceAuthor`, `sourceUrl` (link‑out), `rating` (star icons), `cover` (small image at top).

### 7.6 Tag pages — `/tags/[tag]`

```vue
<!-- app/pages/tags/[tag].vue -->
<script setup lang="ts">
const route = useRoute()
const tag = computed(() => route.params.tag as string)

const { data: posts } = await useAsyncData(`tag-${tag.value}`, () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .where('tags', 'CONTAINS', tag.value)
    .order('pubDatetime', 'DESC')
    .all()
)

useHead({ title: `#${tag.value} — alexop.dev` })
</script>

<template>
  <UContainer class="py-12 max-w-2xl">
    <h1 class="text-3xl font-semibold mb-8">
      <span class="text-muted">#</span>{{ tag }}
    </h1>
    <ul class="space-y-6">
      <li v-for="p in posts" :key="p.path"><PostListItem :post="p" /></li>
    </ul>
  </UContainer>
</template>
```

### 7.7 RSS feed

```ts
// server/routes/rss.xml.ts
import { Feed } from 'feed'

export default defineEventHandler(async (event) => {
  const posts = await queryCollection(event, 'blog')
    .where('draft', '=', false)
    .order('pubDatetime', 'DESC')
    .limit(20)
    .all()

  const feed = new Feed({
    id: 'https://alexop.dev/',
    link: 'https://alexop.dev/',
    title: 'alexop.dev',
    description: 'Vue, Nuxt, and AI by Alexander Opalic',
    copyright: `© ${new Date().getFullYear()} Alexander Opalic`,
    updated: posts[0]?.pubDatetime ?? new Date()
  })

  for (const p of posts) {
    feed.addItem({
      id: p.path,
      title: p.title,
      link: `https://alexop.dev${p.path}`,
      description: p.description,
      date: new Date(p.pubDatetime)
    })
  }

  setHeader(event, 'content-type', 'application/rss+xml')
  return feed.rss2()
})
```

```bash
pnpm add feed
```

### 7.8 Prerender + sitemap

```ts
// nuxt.config.ts (excerpt)
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxt/content'],
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { prerender: true },
    '/notes/**': { prerender: true },
    '/til/**': { prerender: true },
    '/tags/**': { prerender: true },
    '/rss.xml': { prerender: true }
  }
})
```

### Phase 2 acceptance criteria
- [ ] `/` shows the 5 most recent posts in a clean list.
- [ ] `/blog` lists all 113 posts, sorted newest first.
- [ ] `/blog/atomic` (or any real slug) renders the post body via `ContentRenderer`.
- [ ] `/notes` and `/til` work the same shape.
- [ ] `/tags/vue` shows posts tagged `vue`.
- [ ] Color‑mode toggle in the header works (light / dark / system).
- [ ] `/rss.xml` returns valid RSS XML with the latest 20 posts.
- [ ] `pnpm build` succeeds and produces a static output for prerendered routes.
- [ ] No console errors in browser dev tools on any page.
- [ ] Deployed preview URL on Vercel works.

**Commit:** `feat: blog ui — landing, list/post pages, tags, rss, color mode`

### 🛑 Stop. Open PR. Wait for Alex.
- **Branch:** `feat/phase-2-blog-ui`
- **What Alex will check:** typography (`prose` styling reads well, code blocks have a sensible theme), keyboard nav works, color mode persists on reload, the prerender list in `routeRules` covers everything we want statically built, no AI imports have leaked in early.
- **Include in PR:** screenshots of `/`, `/blog`, a post page (light + dark).
- **Don't start Phase 3 until this PR is merged.**

---

## 8. Phase 3 — MCP server with content tools

Same architecture as nuxt.com: an MCP server at `/mcp` that any client (Cursor, Claude Desktop, our own agent later) can call.

### 8.1 Install + register

```bash
pnpm add @nuxtjs/mcp-toolkit
```

```ts
// nuxt.config.ts (add to modules)
modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxt/content', '@nuxtjs/mcp-toolkit'],
mcp: {
  name: 'alexop-blog',
  version: '0.1.0',
  description: 'Search and read Alex Opalic\'s blog, notes, and TILs',
  transports: ['http']
}
```

### 8.2 The six tools

**Three tools per content type** (list + get), because tool names route better than parameters.

```ts
// server/mcp/tools/list-blog-posts.ts
import { z } from 'zod'
import { defineMcpTool } from '@nuxtjs/mcp-toolkit/utils'
import { queryCollection } from '@nuxt/content/utils'

export default defineMcpTool({
  name: 'list_blog_posts',
  description: 'List published blog posts. Use when the user asks what Alex has written about a topic, or to discover posts by tag. Returns title, slug, description, tags, and pubDatetime.',
  inputSchema: z.object({
    tag: z.string().optional().describe('Filter to posts containing this tag'),
    limit: z.number().min(1).max(50).default(20)
  }),
  async handler({ tag, limit }, event) {
    const query = queryCollection(event, 'blog')
      .where('draft', '=', false)
      .order('pubDatetime', 'DESC')
      .limit(limit)
    if (tag) query.where('tags', 'CONTAINS', tag)
    const rows = await query.all()
    return rows.map(r => ({
      title: r.title,
      slug: r.path,
      description: r.description,
      tags: r.tags,
      pubDatetime: r.pubDatetime
    }))
  }
})
```

```ts
// server/mcp/tools/get-blog-post.ts
export default defineMcpTool({
  name: 'get_blog_post',
  description: 'Fetch the full content of a blog post by its slug (e.g. /blog/atomic). Returns title, description, body markdown, and metadata. Prefer this over list_blog_posts when you already know the post.',
  inputSchema: z.object({ slug: z.string() }),
  async handler({ slug }, event) {
    const row = await queryCollection(event, 'blog').where('path', '=', slug).first()
    if (!row) throw new Error(`Post not found: ${slug}`)
    return {
      title: row.title, description: row.description, pubDatetime: row.pubDatetime,
      tags: row.tags, body: row.body
    }
  }
})
```

Mirror the same shape for `list_notes`, `get_note`, `list_tils`, `get_til`. **Six tools total.**

### 8.3 Test the MCP server independently

```bash
pnpm dev
# in another terminal:
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

Click each tool, fill inputs, see structured responses. **If this doesn't work, do not move on.**

### Phase 3 acceptance criteria
- [ ] MCP Inspector lists all 6 tools with correct descriptions.
- [ ] `list_blog_posts({ tag: 'vue' })` returns ≥1 row.
- [ ] `get_blog_post({ slug: '/blog/atomic' })` returns the markdown body.
- [ ] Cursor (or Claude Desktop) can connect to `http://localhost:3000/mcp` and use the tools.
- [ ] Tool descriptions read like instructions to a human, not field‑label noise.

**Commit:** `feat: mcp server with list/get tools for blog, notes, til`

### 🛑 Stop. Open PR. Wait for Alex.
- **Branch:** `feat/phase-3-mcp-server`
- **What Alex will check:** tool descriptions are good prompts (this matters for routing accuracy in Phase 9), zod schemas are tight (no stray `.optional()` on inputs that should be required), draft posts are filtered everywhere.
- **Include in PR:** a screenshot of MCP Inspector connected, with one tool call shown.
- **Don't start Phase 4 until this PR is merged.**

---

## 9. Phase 4 — Agent endpoint

The single Nitro handler the browser will talk to. Lift the skeleton from `nuxt.com/server/api/agent.post.ts:1-228` and trim aggressively.

```bash
pnpm add ai @ai-sdk/vue @ai-sdk/mcp
```

### 9.1 System prompt

```ts
// server/utils/system-prompt.ts
const BASE_PROMPT = `You are an assistant that helps users explore Alex Opalic's blog, notes, and TILs at alexop.dev.

# Tools — when to use what
- list_blog_posts: when the user asks what Alex has written, or wants to discover posts by topic.
- get_blog_post: when you have a specific slug and want the full content. Always prefer this over re-listing.
- list_notes / get_note: book / article / video reviews.
- list_tils / get_til: short "today I learned" snippets.

# Page context
When the request includes a "Current page" line at the top of this prompt, that's the page the user has open in the browser. Treat it as a strong hint for vague questions like "tldr", "explain this", "summarize". Map the path to the right tool:
- /blog/<slug>  → get_blog_post with that exact slug
- /notes/<slug> → get_note
- /til/<slug>   → get_til

# Rules
- Never invent post titles or slugs. Always use a list_* tool first if unsure.
- ALWAYS write text after a tool call — never end a turn with only tool calls.
- Never call the same tool twice with the same input in one turn.
- Use plain prose. No \`##\` headings (the chat panel is narrow).
- Markdown links should be root-relative (\`/blog/...\`).
- If you cannot find an answer in the tools after 2 calls, ask the user a clarifying question.`

const PAGE_PATH_PATTERN = /^\/[\w./-]*$/

export function buildSystemPrompt(pagePath: string | null): string {
  if (!pagePath || !PAGE_PATH_PATTERN.test(pagePath) || pagePath.length > 256) {
    return BASE_PROMPT
  }
  return `Current page: ${pagePath}\n\n${BASE_PROMPT}`
}
```

### 9.2 The endpoint

```ts
// server/api/agent.post.ts
import {
  streamText, convertToModelMessages, createUIMessageStream,
  createUIMessageStreamResponse, safeValidateUIMessages
} from 'ai'
import type { ToolSet } from 'ai'
import { createMCPClient } from '@ai-sdk/mcp'
import { buildSystemPrompt } from '../utils/system-prompt'

const MAX_STEPS = 8
const MODEL = 'anthropic/claude-sonnet-4.6'   // routed via AI Gateway

function stopWhenResponseComplete({ steps }) {
  const last = steps.at(-1)
  if (!last) return false
  const hasText = Boolean(last.text?.trim())
  const noTools = !last.toolCalls?.length
  if (hasText && noTools) return true
  return steps.length >= MAX_STEPS
}

export default defineEventHandler(async (event) => {
  const raw = await readBody(event) as { messages?: unknown }
  const validated = await safeValidateUIMessages({ messages: raw.messages })
  if (!validated.success) throw createError({ statusCode: 400, statusMessage: 'Invalid messages' })

  const pagePath = getHeader(event, 'x-page-path')?.trim() ?? null

  const abort = new AbortController()
  event.node.req.on('close', () => abort.abort())

  const mcp = await createMCPClient({
    transport: { type: 'http', url: `${getRequestURL(event).origin}/mcp` }
  })
  const mcpTools = await mcp.tools()
  const closeMcp = () => event.waitUntil(mcp.close())

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: MODEL,
        maxOutputTokens: 2000,
        abortSignal: abort.signal,
        stopWhen: stopWhenResponseComplete,
        system: buildSystemPrompt(pagePath),
        messages: await convertToModelMessages(validated.data),
        tools: { ...mcpTools as ToolSet },
        onFinish: closeMcp,
        onAbort: closeMcp,
        onError: closeMcp
      })
      writer.merge(result.toUIMessageStream({ originalMessages: validated.data }))
    }
  })
  return createUIMessageStreamResponse({ stream })
})
```

### Phase 4 acceptance criteria
- [ ] `curl -X POST http://localhost:3000/api/agent -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","parts":[{"type":"text","text":"what did alex write about vue testing?"}]}]}'` streams text deltas.
- [ ] Sending the curl with `-H "x-page-path: /blog/atomic"` produces an answer that references the atomic post specifically.
- [ ] Closing curl mid‑stream aborts the run (no orphan tokens billed).
- [ ] `AI_GATEWAY_API_KEY` is in `.env` and `.env.example`.

**Commit:** `feat: streaming /api/agent endpoint with mcp + page-context + stop predicate`

### 🛑 Stop. Open PR. Wait for Alex.
- **Branch:** `feat/phase-4-agent-endpoint`
- **What Alex will check:** the abort handling actually fires (test by killing curl mid‑answer and watching the server log), `safeValidateUIMessages` rejects malformed bodies with 400, the page‑path regex doesn't accept absolute URLs, the system prompt is in its own file (not inlined).
- **Don't start Phase 5 until this PR is merged.**

---

## 10. Phase 5 — Chat slideover (the agent goes live)

The chat is **not** a standalone `/chat` page. It's a **slideover** triggered by an "Ask my blog" button in the header. It's available on every page, and on post pages it forwards `x-page-path` so "explain this" works.

### 10.1 Global open/close state

```ts
// app/composables/useChatSlideover.ts
export const useChatSlideover = () => useState('chat-slideover-open', () => false)
```

### 10.2 The slideover component

```vue
<!-- app/components/chat/ChatSlideover.vue -->
<script setup lang="ts">
import { Chat, DefaultChatTransport } from '@ai-sdk/vue'
import type { UIMessage } from 'ai'

const open = useChatSlideover()
const route = useRoute()

const chatId = useSessionStorage('agent-chat-id', () => crypto.randomUUID())
const messages = useSessionStorage<UIMessage[]>('agent-messages', [])
const useContext = useLocalStorage('agent-use-context', true)

const CONTEXT_PREFIXES = ['/blog/', '/notes/', '/til/']
const currentPage = computed(() => {
  if (!CONTEXT_PREFIXES.some(p => route.path.startsWith(p))) return null
  return route.path
})

const chat = new Chat({
  messages: messages.value,
  transport: new DefaultChatTransport({
    api: '/api/agent',
    headers: () => {
      const h: Record<string, string> = { 'x-chat-id': chatId.value }
      if (useContext.value && currentPage.value) h['x-page-path'] = currentPage.value
      return h
    }
  }),
  onFinish: () => { messages.value = chat.messages }
})

const input = ref('')
async function send() {
  if (!input.value.trim()) return
  await chat.sendMessage({ text: input.value })
  input.value = ''
}
</script>

<template>
  <USlideover v-model:open="open" :ui="{ content: 'max-w-xl' }">
    <template #title>Ask my blog</template>
    <template #body>
      <div class="flex flex-col h-full">
        <div v-if="currentPage" class="px-3 py-2 text-xs text-muted border-b border-default">
          <UCheckbox v-model="useContext" :label="`Using context: ${currentPage}`" />
        </div>
        <UChatMessages :messages="chat.messages" :status="chat.status" class="flex-1 overflow-y-auto">
          <template #content="{ message }"><ChatContent :message="message" /></template>
        </UChatMessages>
        <UChatPrompt v-model="input" placeholder="Ask anything…" @submit="send">
          <UChatPromptSubmit :status="chat.status" />
        </UChatPrompt>
      </div>
    </template>
  </USlideover>
</template>
```

### 10.3 Render‑per‑part switch

```vue
<!-- app/components/chat/ChatContent.vue -->
<script setup lang="ts">
import type { UIMessage } from 'ai'
defineProps<{ message: UIMessage }>()
function getToolName(part: any) { return part.type?.replace(/^tool-/, '') }
function isToolStreaming(part: any) {
  return part.state === 'input-streaming' || part.state === 'input-available'
}
</script>

<template>
  <template v-for="part in message.parts" :key="part.id ?? part.type">
    <UChatMessage v-if="part.type === 'text'" :content="part.text" />
    <UChatTool
      v-else-if="part.type?.startsWith('tool-')"
      :icon="getToolName(part)?.startsWith('list_') ? 'i-lucide-list' : 'i-lucide-file-text'"
      :streaming="isToolStreaming(part)"
      :text="getToolName(part)"
    />
  </template>
</template>
```

### 10.4 Wire the trigger button in the header

```vue
<!-- AppHeader.vue — add to the right cluster -->
<UButton
  icon="i-lucide-sparkles"
  variant="soft"
  @click="useChatSlideover().value = true"
>
  Ask my blog
</UButton>
```

### 10.5 Mount the slideover globally

```vue
<!-- app/layouts/default.vue — add ChatSlideover at the bottom -->
<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1"><slot /></main>
    <AppFooter />
    <ChatSlideover />
  </div>
</template>
```

### Phase 5 acceptance criteria
- [ ] Clicking "Ask my blog" on `/` opens the slideover.
- [ ] Asking "what did Alex write about Vue testing?" streams a response with tool pills.
- [ ] On `/blog/atomic`, the slideover shows "Using context: /blog/atomic" and "tldr this" gives a summary of *that post* (not a generic one).
- [ ] Toggling the context checkbox off makes the agent treat the question as page‑independent.
- [ ] Closing the slideover and reopening keeps the conversation (sessionStorage).
- [ ] No layout shift while streaming.
- [ ] Esc closes the slideover.

**Commit:** `feat: chat slideover with @ai-sdk/vue + page-context forwarding`

### 🛑 Stop. Open PR. Wait for Alex.
- **Branch:** `feat/phase-5-chat-slideover`
- **What Alex will check:** the slideover is reachable via keyboard (focus trap when open, Esc closes), context‑off mode actually omits the header, the chat ID isn't shared across browsers, animations don't jank on slow networks.
- **Include in PR:** a 10–15 second screen recording showing: open slideover → ask context‑aware question → see tool pills → result.
- **Don't start Phase 6 until this PR is merged.**

---

## 11. Phase 6 — Native UI tool (`show_post`)

The pattern: **the model never formats a card in markdown**. It calls a tool, the tool returns JSON, a Vue component renders it.

### 11.1 Define the tool

```ts
// server/utils/tools/show-post.ts
import { tool } from 'ai'
import { z } from 'zod'

export const showPostTool = tool({
  description: 'Render a clickable card for a single blog post. Use this AFTER you have confirmed the post exists (via list_blog_posts or get_blog_post). Pass a real slug — never invent one.',
  inputSchema: z.object({ slug: z.string().describe('The post slug, e.g. /blog/atomic') }),
  execute: async ({ slug }) => {
    const event = useEvent()
    const post = await queryCollection(event, 'blog').where('path', '=', slug).first()
    if (!post) throw new Error(`No post at ${slug}`)
    return {
      title: post.title, slug: post.path, description: post.description,
      tags: post.tags, pubDatetime: post.pubDatetime
    }
  }
})
```

### 11.2 Add to the agent endpoint

```ts
// server/api/agent.post.ts (update tools)
import { showPostTool } from '../utils/tools/show-post'
// …
tools: { ...mcpTools as ToolSet, show_post: showPostTool }
```

### 11.3 The card

```vue
<!-- app/components/tools/PostCard.vue -->
<script setup lang="ts">
defineProps<{ title: string, slug: string, description: string, tags: string[], pubDatetime: string }>()
</script>

<template>
  <NuxtLink :to="slug" class="not-prose block">
    <UCard class="hover:border-primary transition">
      <div class="text-xs text-toned mb-1">{{ new Date(pubDatetime).toLocaleDateString() }}</div>
      <div class="font-semibold">{{ title }}</div>
      <p class="text-sm text-muted mt-1">{{ description }}</p>
      <div class="flex gap-1 mt-3">
        <UBadge v-for="t in tags" :key="t" variant="soft" size="sm">{{ t }}</UBadge>
      </div>
    </UCard>
  </NuxtLink>
</template>
```

### 11.4 Wire the client switch

```vue
<!-- ChatContent.vue — add a branch -->
<template v-else-if="getToolName(part) === 'show_post'">
  <UChatTool icon="i-lucide-file-text" :streaming="isToolStreaming(part)" text="Loading post…" />
  <ToolsPostCard v-if="part.state === 'output-available'" v-bind="part.output" />
</template>
```

### 11.5 Update the system prompt

Add to `BASE_PROMPT`: *"When you reference a specific blog post in your answer, also call `show_post({ slug })` so the user gets a clickable card."*

### Phase 6 acceptance criteria
- [ ] Asking "show me the atomic post" produces a styled card linking to `/blog/atomic`.
- [ ] Hallucinated slugs throw and surface as a tool error (model recovers gracefully).
- [ ] Cards render in `output-available` state only — no flash of empty card.
- [ ] Clicking the card navigates to the post and the slideover stays open.

**Commit:** `feat: native show_post tool + PostCard component`

### 🛑 Stop. Open PR. Wait for Alex.
- **Branch:** `feat/phase-6-show-post`
- **What Alex will check:** `useEvent()` is correctly imported (h3 helper), the tool description is unambiguous about ordering ("call AFTER list/get"), the card matches the existing `PostListItem` styling so the chat doesn't feel out of place.
- **Don't start Phase 7 until this PR is merged.**

---

## 12. Phase 7 — Persistence

Add Drizzle + libSQL so chats survive reloads server‑side. **Local dev** uses a plain SQLite file (`file:./local.db`). **Production** points at a [Turso](https://turso.tech) database — same libSQL dialect, free tier, two env vars.

```bash
pnpm add drizzle-orm @libsql/client
pnpm add -D drizzle-kit
```

### 12.1 Drizzle client

```ts
// server/db/client.ts
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:./local.db',
  authToken: process.env.TURSO_AUTH_TOKEN
})

export const db = drizzle(client, { schema })
export { schema }
```

### 12.2 Schema (identical shape to nuxt.com)

```ts
// server/db/schema.ts
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

export const agentChats = sqliteTable('agent_chats', {
  id: text('id').primaryKey(),
  messages: text('messages', { mode: 'json' }).notNull(),
  fingerprint: text('fingerprint').notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  estimatedCost: real('estimated_cost').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(0),
  requestCount: integer('request_count').notNull().default(0),
  createdAt: integer({ mode: 'timestamp' }).notNull(),
  updatedAt: integer({ mode: 'timestamp' }).notNull()
}, t => [index('agent_chats_fingerprint_idx').on(t.fingerprint)])

export const agentDailyUsage = sqliteTable('agent_daily_usage', {
  dayKey: text('day_key').primaryKey(),    // rate:agent:<ip>:YYYY-MM-DD
  count: integer('count').notNull()
})
```

### 12.3 drizzle‑kit config + scripts

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'sqlite',
  driver: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? 'file:./local.db',
    authToken: process.env.TURSO_AUTH_TOKEN
  }
})
```

```jsonc
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate":  "drizzle-kit migrate",
    "db:studio":   "drizzle-kit studio"
  }
}
```

Workflow: edit `schema.ts` → `pnpm db:generate` → commit the generated SQL → `pnpm db:migrate`.

### 12.4 Save on stream finish

In `agent.post.ts`, import `db` and add a `saveChat` function with the same upsert‑accumulator + fingerprint guard pattern from `nuxt.com/server/api/agent.post.ts:141-183`. Copy it verbatim. Call via `event.waitUntil(saveChat(finalizedMessages))` inside `toUIMessageStream({ onFinish })`.

### Phase 7 acceptance criteria
- [ ] After a conversation, `sqlite3 local.db "SELECT * FROM agent_chats"` shows one row with messages + token counts.
- [ ] Sending a follow‑up turn updates the same row (request_count goes up, tokens accumulate).
- [ ] `pnpm db:studio` opens drizzle studio.
- [ ] Migration SQL is committed to `server/db/migrations/`.
- [ ] `local.db*` is in `.gitignore`.

**Commit:** `feat: persist chats via drizzle + libsql with usage accumulator`

### 🛑 Stop. Open PR. Wait for Alex.
- **Branch:** `feat/phase-7-persistence`
- **What Alex will check:** the SQL accumulator is `+ ${value}` not `+ value` (drizzle `sql` template usage), `messages: text('messages', { mode: 'json' })` survives a round‑trip, `local.db` is not committed.
- **Don't start Phase 8 until this PR is merged.**

---

## 13. Phase 8 — Production hygiene

Four small additions, lifted from nuxt.com. **No new feature scope** — this phase only hardens what's already there.

1. **Fingerprint guard** (`server/utils/agent-fingerprint.ts`) — SHA‑1 of `domain + ip + ua`. Use it in the upsert `where` clause.
2. **Rate limit** (`server/utils/rate-limit.ts`) — increment‑then‑check, 20/day per IP, atomic via Drizzle transaction. Copy `nuxt.com/server/utils/rate-limit.ts` verbatim. Call `await consumeAgentRateLimit(event)` at the top of `agent.post.ts`.
3. **Daily cleanup cron** (`server/api/agent/cleanup.get.ts`) — Bearer‑gated (`NUXT_CRON_SECRET`), 30‑day chat retention, 7‑day usage retention. Copy from `nuxt.com/server/api/agent/cleanup.get.ts`.
4. **`vercel.json`**:
   ```json
   { "crons": [{ "path": "/api/agent/cleanup", "schedule": "0 3 * * *" }] }
   ```

### Phase 8 acceptance criteria
- [ ] 21st chat in a day from the same IP returns 429.
- [ ] Two browsers can't overwrite each other's chats (different fingerprints) — verify by manually crafting a fake `x-chat-id`.
- [ ] Hitting `/api/agent/cleanup` without a Bearer token returns 401.
- [ ] `NUXT_CRON_SECRET` documented in README + `.env.example`.

**Commit:** `feat: rate limit, fingerprint guard, cleanup cron`

### 🛑 Stop. Open PR. Wait for Alex.
- **Branch:** `feat/phase-8-hygiene`
- **What Alex will check:** the rate limit really is increment‑then‑check (not check‑then‑increment), the fingerprint guard goes on the `where` of `onConflictDoUpdate`, the cron secret is loaded from `useRuntimeConfig` not `process.env` directly.
- **Don't start Phase 9 until this PR is merged.**

---

## 14. Phase 9 — Evals

Tool‑routing evals via evalite. See `testing-non-deterministic-agents-with-evals.md` for the full theory.

```bash
pnpm add -D evalite @ai-sdk/mcp
```

```ts
// test/mcp.eval.ts
import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { generateText } from 'ai'
import { evalite } from 'evalite'
import { toolCallAccuracy } from 'evalite/scorers'

const model = 'openai/gpt-4o-mini'    // smaller/cheaper than production
const MCP_URL = process.env.MCP_URL ?? 'http://localhost:3000/mcp'

evalite('Blog tools — routing', {
  data: async () => [
    { input: 'What did Alex write about Vue testing?',
      expected: [{ toolName: 'list_blog_posts', input: { tag: 'testing' } }] },
    { input: 'Show me the atomic post',
      expected: [{ toolName: 'get_blog_post', input: { slug: '/blog/atomic' } }] },
    { input: 'List recent TILs',
      expected: [{ toolName: 'list_tils' }] },
    { input: 'What books has Alex reviewed?',
      expected: [{ toolName: 'list_notes' }] },
    { input: 'hi', expected: [] }   // negative control
  ],
  task: async (input) => {
    const mcp = await createMCPClient({ transport: { type: 'http', url: MCP_URL } })
    try {
      const r = await generateText({ model, prompt: input, tools: await mcp.tools() })
      return r.toolCalls ?? []
    } finally { await mcp.close() }
  },
  scorers: [async ({ output, expected }) =>
    toolCallAccuracy({ actualCalls: output, expectedCalls: expected })]
})
```

### Phase 9 acceptance criteria
- [ ] `pnpm dev` + `pnpm eval` runs and reports a score per case.
- [ ] At least 80% of cases score 1.0.
- [ ] Negative control passes (model doesn't tool‑call on "hi").
- [ ] CI workflow runs `pnpm eval` (gated initially as informational, not failing).

**Commit:** `feat: evalite tool-routing suite`

### 🛑 Stop. Open PR. Wait for Alex.
- **Branch:** `feat/phase-9-evals`
- **What Alex will check:** the eval cases are biased toward routing not content quality, the cheaper model is actually configured, the CI job passes its `OPENAI_API_KEY` from secrets.
- **Don't start Phase 10 until this PR is merged.**

---

## 15. Phase 10 — Optional polish (only if time)

Each of these is a separate PR — same gated rhythm.

- **Voting per message** — `agent_votes` table + `POST /api/agent/vote`. Same pattern as `nuxt.com/server/api/agent/vote.post.ts`. Thumbs up/down rendered in `ChatContent.vue`. Branch: `feat/phase-10a-votes`.
- **Telemetry via evlog** — `pnpm add evlog`, wrap with `ai.wrap()`, log token usage and cost per call. Branch: `feat/phase-10b-telemetry`.
- **Admin dashboard** — `/admin` page (client‑only) showing per‑chat token usage from the accumulator columns. Gated by GitHub OAuth (`nuxt-auth-utils`). Branch: `feat/phase-10c-admin`.

---

## 16. Environment variables

```bash
# .env.example
AI_GATEWAY_API_KEY=          # https://vercel.com/ai-gateway
NUXT_CRON_SECRET=            # any long random string (used by /api/agent/cleanup)
OPENAI_API_KEY=              # only needed for evals (Phase 9)

# DB — leave both unset locally to use ./local.db
TURSO_DATABASE_URL=          # libsql://<your-db>.turso.io  (prod only)
TURSO_AUTH_TOKEN=            # https://turso.tech dashboard (prod only)
```

**Local dev** needs no DB setup — `@libsql/client` writes to `./local.db` automatically. Just `pnpm db:migrate` once after Phase 7. **Production**: create a Turso DB (`turso db create alexop-agent`), grab URL + token, set as Vercel env vars, run `pnpm db:migrate` against the production URL once.

---

## 17. README structure (the tutorial wrapper)

The README *is* the deliverable. Structure it so each phase commit maps to a section the reader can stop at:

```markdown
# nuxt-agent-from-scratch

A complete Nuxt blog with an AI chat assistant, built phase by phase.
Reproduces the architecture of nuxt.com/agent against the content of alexop.dev.

## Quickstart
… (clone, install, env, dev)

## How it works — phase by phase

### Phase 0 — Quality gate first
Why oxlint + ESLint + lefthook before any feature code. → `chore: scaffold...`

### Phase 1 — Content migration
113 mdx posts → nuxt content. The migration script. → `feat: migrate...`

### Phase 2 — Blog UI
Landing, list, post pages. RSS. Color mode. No AI yet. → `feat: blog ui...`

### Phase 3 — MCP server
Six tools. Test with MCP Inspector. → `feat: mcp server...`

### Phase 4 — Agent endpoint
…

(one section per phase, link to the merged PR)

## Diverging from nuxt.com
What we cut and why.

## Credits
- Architecture: [nuxt.com](https://github.com/nuxt/nuxt.com)
- Content: [alexop.dev](https://alexop.dev)
- Eval framework: [evalite](https://www.evalite.dev)
```

---

## 18. Common pitfalls (read before you start)

- **Don't `pnpm i` Nuxt 3 by accident.** Use `nuxi@latest` — Nuxt 4 is the default but old tutorials linger.
- **`@ai-sdk/mcp` API name changes.** It exports `experimental_createMCPClient` *and* `createMCPClient` depending on version. Check `node_modules/@ai-sdk/mcp/package.json#exports` if imports fail.
- **`@nuxt/content` v3 vs v2.** `queryCollection` is v3. v2 used `queryContent`. Pin v3.
- **MCP server unreachable from agent.** The loopback URL must be `getRequestURL(event).origin + '/mcp'`. Do NOT hardcode `localhost:3000` — it breaks in production.
- **MDX components in migrated content.** Run the migration script *before* `pnpm dev` — Nuxt Content will throw on unknown components.
- **AI Gateway 401.** Models route via `provider/model` strings only when `AI_GATEWAY_API_KEY` is set.
- **Drizzle migrations.** `pnpm db:generate` after every schema change, commit the SQL, then `pnpm db:migrate` against both local and Turso prod. Forgetting the prod migrate means the deployed app crashes on first request.
- **Turso URL must use `libsql://`, not `https://`.** The auth token is per‑database — don't reuse the org‑wide token.
- **Evals need a dev server running.** `pnpm dev` must be up in another terminal.
- **`safeValidateUIMessages` is not optional.** Skipping it means a malicious client can fake assistant turns.
- **Don't commit `local.db` or `local.db-*`.** Add `local.db*` to `.gitignore`.
- **`USlideover` mounts inside `<UApp>`.** If your `app.vue` doesn't wrap in `<UApp>`, slideovers render but don't animate.
- **`useEvent()` only works inside server context.** It's a Nitro helper; calling it from a Vue component throws.

---

## 19. Definition of done

The project is "done" when:

1. A reader who's never built an AI feature can clone, `pnpm i && pnpm dev`, and chat with the blog within 5 minutes.
2. The blog is also useful as a *blog* — Alex could publish to it tomorrow without the AI part.
3. Each commit on `main` matches a README section title 1:1.
4. Every PR was reviewed by Alex before the next phase started.
5. CI is green on every PR.
6. `pnpm eval` reports ≥80% routing accuracy.
7. The Nuxt agent tutorial (`building-a-documentation-agent-tutorial.md`) and this repo can be read side‑by‑side and a junior dev sees how each Nuxt code path maps to the smaller version here.

That last point is the real success metric. The repo is a teaching artifact. If a reader finishes Phase 5 and goes "oh — *that's* what `toUIMessageStream` does," it worked.
