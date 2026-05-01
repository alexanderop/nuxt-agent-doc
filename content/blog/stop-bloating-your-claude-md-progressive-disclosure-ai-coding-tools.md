---
author: Alexander Opalic
pubDatetime: 2026-01-18T00:00:00Z
title: "Stop Bloating Your CLAUDE.md: Progressive Disclosure for AI Coding Tools"
description: "AI coding tools are stateless—every session starts fresh. The solution isn't cramming everything into CLAUDE.md, but building a layered context system where learnings accumulate in docs and specialized agents load on-demand."
tags: ["claude-code", "ai-tools", "developer-experience", "productivity"]
draft: false
---

Yesterday I spent an hour debugging a Nuxt Content gotcha with Claude. We figured it out together—you need to use `stem` instead of `slug` in page collection queries. Today? Claude made the same mistake. Yesterday's session was gone.

> 
The examples in this post come from my [Second Brain](https://second-brain-nuxt.vercel.app/)—a personal wiki built with Nuxt and Nuxt Content that uses Zettelkasten-style wiki-links for knowledge management. You can see the actual [CLAUDE.md file](https://github.com/alexanderop/second-brain-nuxt/blob/main/CLAUDE.md) on GitHub.

That's the constraint. **Your context is just an array of tokens**—a sliding window that forgets everything the moment the conversation ends.[^1]

> 
The percentages shown in these visualizations are illustrative examples—not real measurements. Actual system prompt overhead varies by tool version and configuration. The key insight is the relative proportions, not the exact numbers.

There's no hidden memory. No database of past conversations. Just this array, rebuilt fresh every session.

Dex Horthy calls this "context engineering"—since LLMs are stateless, the only way to improve output is optimizing input.[^6] The array is all you have. Everything outside it doesn't exist to the model.

But that array has a size limit. Fill it with noise, and you're working in what Dex calls the "dumb zone"—where performance degrades because irrelevant context competes for attention.

Most developers respond to this by putting every lesson learned into their `CLAUDE.md` file. I've seen files balloon to 2000 lines. Style guides, architectural decisions, war stories from that one bug that took three days to fix.

This makes things worse.

## Bloated CLAUDE.md Makes Things Worse

When Claude makes a mistake, the instinct is to add a rule: "Never use `slug` in page collection queries—use `stem` instead."

Then another mistake, another rule. Then another.

Before long, your CLAUDE.md looks like this:

```markdown
# CLAUDE.md

## Project Overview
...50 lines...

## Code Style
...200 lines of formatting rules...

## Architecture Decisions
...150 lines of historical context...

## Gotchas
...300 lines of edge cases...

## Testing Conventions
...100 lines...
```

**Half your context budget is gone before any work begins.**

HumanLayer keeps their CLAUDE.md under 60 lines.[^2] Frontier LLMs reliably follow 150-200 instructions—and Claude Code's system prompt already uses about 50 of those.[^2]

The math doesn't work. You can't stuff everything in one file.

## Stop Writing Prose About Lint Rules

Why write two hundred lines about code style when one line handles it? I stopped putting anything a tool can enforce in CLAUDE.md.

❌ **Don't write prose about style rules:**
```markdown
## Code Style
- Use 2-space indentation
- Prefer single quotes
- Always add trailing commas
- Maximum line length: 100 characters
```

✅ **Let ESLint handle it:**
```json
{
  "extends": ["@nuxt/eslint-config"]
}
```

The rules are already there—you just don't repeat them in prose:
```js
// What @nuxt/eslint-config contains:
{
  rules: {
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'comma-dangle': ['error', 'always-multiline'],
    'max-len': ['error', { code: 100 }]
  }
}
```

The AI can run `pnpm lint:fix && pnpm typecheck` and know immediately if it violated a rule. No interpretation needed. No ambiguity.

**If a tool can enforce it, don't write prose about it.** ESLint for style. TypeScript for types. Prettier for formatting. These rules are verifiable, not interpretable.

Moss calls this *backpressure*—automated feedback mechanisms that let agents self-correct.[^7] Without a linter, you waste your time typing messages like "you forgot to add the import" or "that should be a const, not let." With backpressure, the agent runs the build, reads the error, and fixes itself. You remove yourself from trivial corrections and focus on higher-level decisions.

My CLAUDE.md now just says:

```markdown
Run `pnpm lint:fix && pnpm typecheck` after code changes.
```

One line instead of two hundred. Or skip it entirely—use husky to run checks automatically on commit. This is especially useful for techniques like Ralph, where AI works autonomously through a queue of tasks.[^8]

## The Gotchas ESLint Won't Catch

ESLint won't catch this:

> "Nuxt Content v3 caches aggressively in `.data/`. When you modify transformation logic in hooks, you must clear the cache to test changes."

Or this:

{/* > "Don't mock `@nuxt/content/server` internals in tests—it breaks when Nuxt Content updates. Extract pure logic to `server/utils/` instead." */}

Or this:

> "Wiki-links to data collections require path prefixes. Use `[[authors/john-doe]]`, not `[[john-doe]]`."

These are *gotchas*—non-obvious behaviors that bite you once. The kind of thing you'd tell a new team member on their first day. They need documentation, but they don't belong in CLAUDE.md.

**The insight: CLAUDE.md is for universal context. Gotchas are situational.**

You don't need the wiki-link prefix rule in every conversation—only when you're writing content with author links. Loading it every time wastes tokens.

So where do these gotchas go? And how do you capture them without breaking your flow?

## My /learn Skill

My system: when I notice Claude struggling with something we've solved before, I run `/learn`.

This is a Claude Code skill I built ([see full prompt](/prompts/claude/claude-learn-command)). It:

1. Analyzes the conversation for reusable, non-obvious insights
2. Finds the right place in `/docs` to save it (or proposes a new file)
3. Asks for my approval before saving

I end up with a growing knowledge base in my docs folder:

```
docs/
├── nuxt-content-gotchas.md    # 15 hard-won lessons
├── nuxt-component-gotchas.md  # Vue-specific pitfalls
├── testing-strategy.md        # When to use which test type
└── SYSTEM_KNOWLEDGE_MAP.md    # Architecture overview
```

**CLAUDE.md stays stable.** It just tells Claude where to look:

```markdown
## Further Reading

**IMPORTANT:** Before starting any task, identify which docs below are relevant and read them first. Load the full context before making changes.

- `docs/nuxt-content-gotchas.md` - Nuxt Content v3 pitfalls
- `docs/testing-strategy.md` - Test layers and when to use each
```

The **IMPORTANT** instruction is critical—without it, Claude won't automatically read these docs. With it, Claude identifies relevant docs before starting work: content queries trigger the gotchas doc, testing tasks trigger the testing strategy. Progressive disclosure—the right context at the right time.[^2]

Another approach: build skills that load domain-specific gotchas automatically. A `nuxt-content` skill that injects the gotchas doc whenever you're working with content queries. In theory, this is cleaner—context loads without you thinking about it. In practice, I've found skills don't always activate when expected. The trigger conditions can be fuzzy, and sometimes Claude just doesn't invoke them. Vercel's agent evals confirmed this: skills were never invoked in 56% of their test cases, producing zero improvement over baseline.[^9] The docs-based setup is more predictable: I know Claude will read what I point it to.

## One Agent Per Domain

I take this further with custom agents. Each agent has its own documentation file that loads only when needed. If you're new to how these customization layers work together, I wrote a [detailed comparison of CLAUDE.md, skills, and subagents](/blog/claude-code-customization-guide-claudemd-skills-subagents).

```
.claude/agents/
├── nuxt-content-specialist.md   # Content queries, MDC, search
├── nuxt-ui-specialist.md        # Component styling, theming
├── vue-specialist.md            # Reactivity, composables
└── nuxt-specialist.md           # Routing, config, deployment
```

When I'm debugging a content query, Claude loads the nuxt-content-specialist. When I'm styling a component, it loads nuxt-ui-specialist. The specialist agents know to fetch the latest documentation from official sources—they don't rely on stale training data.

This is why I don't use MCPs like context7 for documentation. Agents can fetch llms.txt directly from official docs sites and find what they need. No tool definition bloat, no intermediate tokens—just a focused research task in its own context window. I wrote more about [why I use custom research agents instead of MCPs](/blog/why-you-dont-need-nuxt-mcp-claude-code).

Skills work similarly—with `context:fork`, they run in isolated contexts without polluting your main conversation. The agent has both the ability and motivation to read real documentation. No context7, no MCP overhead.

## It Compounds

This system creates a feedback loop:

Over time, my `/docs` folder becomes a curated knowledge base of *exactly the things AI coding tools get wrong* in my codebase. It's like fine-tuning, but under my control.

I got this idea from a pattern for self-improving skills where agents automatically analyze sessions and update themselves.[^5] I adapted it to use markdown documentation and a `/learn` command instead—giving me explicit control over what gets captured and where it goes.

An actual entry from my `nuxt-content-gotchas.md`:

```markdown
## Page Collection Queries: Use `stem` Not `slug`

The `slug` field doesn't exist in page-type collections.
Use `stem` (file path without extension) instead:

// ❌ Fails: "no such column: slug"
queryCollection('content').select('slug', 'title').all()

// ✅ Works
queryCollection('content').select('stem', 'title').all()
```

Claude will never make this mistake again in my project. Not because I added it to CLAUDE.md—but because when it's working with content queries, it reads the gotchas doc first.

## My 50-Line CLAUDE.md

The structure:

```markdown
# CLAUDE.md

Second Brain is a personal knowledge base using
Zettelkasten-style wiki-links.

## Commands
pnpm dev          # Start dev server
pnpm lint:fix     # Auto-fix linting issues
pnpm typecheck    # Verify type safety

Run `pnpm lint:fix && pnpm typecheck` after code changes.

## Stack
- Nuxt 4, @nuxt/content v3, @nuxt/ui v3

## Structure
- `app/` - Vue application
- `content/` - Markdown files
- `content.config.ts` - Collection schemas

## Further Reading

**IMPORTANT:** Read relevant docs below before starting any task.

- `docs/nuxt-content-gotchas.md`
- `docs/testing-strategy.md`
- `docs/SYSTEM_KNOWLEDGE_MAP.md`
```

That's it. Universal context only. Everything else lives in docs, agents, or tooling.

## Cross-Tool Compatibility

If you use multiple AI coding tools, you don't need separate config files. VS Code Copilot and Cursor both support `agents.md` for project-level instructions. You can symlink it to share the same configuration:

```bash
# Create a symlink so all tools read the same file
ln -s CLAUDE.md agents.md
```

Now your minimal, focused instructions work across Claude Code, Copilot, and Cursor. One source of truth, no drift between tools.

## How This Played Out Last Week

Last week I was implementing semantic search. When Claude started working on content queries, it read `nuxt-content-gotchas.md` first—as my CLAUDE.md instructs. The stem/slug gotcha was already there.

No mistake. No correction needed.

But during the session, we discovered something new: `queryCollectionSearchSections` returns IDs with a leading slash. Don't add another slash when constructing URLs.

I ran `/learn`. Claude proposed:

```markdown
## Search Section IDs

Returns IDs with leading slash (`/slug#section`).
Don't add another slash when constructing URLs.
```

Added. Next time I work on search, Claude will know.

---

AI tools being stateless isn't a bug to fight. It's a design constraint—like limited screen real estate or slow network connections. Accept it, and you can build systems that work with it.

**Keep CLAUDE.md minimal. Let tooling enforce what it can. Capture learnings as you go. Load context on demand.**

One caveat: you can never be 100% sure agents will read your docs when they face issues. For tricky domains like Nuxt Content—where training data is sparse or outdated—I've learned to be explicit in my prompts. When I know I'm working on something with poor training coverage, I'll add to the plan: "If you encounter issues with Nuxt Content APIs, read `docs/nuxt-content-gotchas.md` first." This nudge makes the difference between the agent guessing based on outdated patterns and actually consulting current knowledge.

The AI forgets. Your documentation doesn't.

---

[^1]: LLMs have no memory between sessions—context is just tokens in a sliding window. See Factory's analysis in [The Context Window Problem](https://factory.ai/news/context-window-problem).

[^2]: HumanLayer's guide on [Writing a Good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md) recommends keeping files under 60 lines and using progressive disclosure for detailed instructions.

[^5]: Developers Digest, [Self-Improving Skills in Claude Code](https://www.youtube.com/watch?v=-4nUCaMNBR8). A pattern for capturing learnings automatically: skills analyze sessions, extract corrections, and update themselves.

[^6]: Dex Horthy, [No Vibes Allowed: Solving Hard Problems in Complex Codebases](https://www.youtube.com/watch?v=rmvDxxNubIg). Dex is the founder of HumanLayer and creator of the Ralph technique for autonomous AI coding. His [12 Factor Agents](https://www.humanlayer.dev/blog/12-factor-agents) manifesto includes "Make Your Agent a Stateless Reducer" as Factor 12.

[^7]: Moss, [Don't Waste Your Back Pressure](https://banay.me/dont-waste-your-backpressure). Backpressure—automated feedback from type systems, linters, and build tools—is what enables agents to work on longer-horizon tasks without constant human intervention.

[^8]: Geoffrey Huntley, [Ralph](https://ghuntley.com/ralph/). Ralph is a technique for autonomous AI coding where tasks are queued and executed without human intervention, making automated checks on commit essential.

[^9]: Jude Gao, [AGENTS.md outperforms skills in our agent evals](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals). Vercel's evals found that a compressed docs index embedded directly in AGENTS.md achieved 100% pass rate, while skills maxed out at 79% even with explicit instructions—and performed no better than baseline when left to trigger naturally.
