# Trust Real Code Over Spec Docs

When a spec, goal doc, or planning artifact disagrees with a comparable working codebase, trust the working code. Spec docs drift; running code is ground truth. For any non-trivial library, framework, or pattern, find a real implementation and read it before committing to the spec's version.

**Why:** Spec docs are written ahead of implementation and rarely re-validated. They confidently describe APIs that don't exist, sample data that's gone, and operators the library never had. Working code in a comparable repo has been compiled, run, and (usually) tested — every line is evidence. The cost of cloning a reference repo is one minute; the cost of building against a wrong spec is hours of rediscovery.

**Pattern:**
- **Keep reference repos accessible.** `~/Projects/opensource/*` is the canonical location. The repos that ship the patterns this project needs:
  - `~/Projects/opensource/nuxt.com` — MCP toolkit usage, agent chat composables, comark streaming, content config.
  - `~/Projects/opensource/npmx.dev` — Playwright + a11y, vitest browser mode, Nuxt test layering.
- **Trigger phrase.** When the user says *"how does opensource/X on my disk do this"* or *"look at opensource/X"*, stop guessing immediately and read the reference repo before writing any more code. This phrasing recurs across sessions and is always a sign that improvising has already cost too much. Read first; don't argue with the redirect.
- **Default to "show me real usage" over "what does the spec say".** When a goal doc cites an API, grep the reference repo for the same call. If the shapes disagree, the spec is wrong.
- **Cite the source file.** Quote the path you read (`~/Projects/opensource/nuxt.com/test/mcp.eval.ts:42`) so the human can verify and so the lesson outlives this conversation.
- **Trim, don't copy.** Reference repos carry baggage — Lighthouse runs, mock connectors, prod-only wiring. Adopt the core pattern and strip the rest.

**When this applies:**
- Library/framework integration where the public docs are thin (MCP toolkits, Nuxt modules, Vite plugins)
- Test infrastructure (Playwright config, evalite harnesses, vitest setups)
- Build/config files where one wrong key silently disables a feature
- Any time a goal/plan doc and the actual API surface seem to disagree

**The Tests:**
- "Did I read a working implementation, or just the spec?" If only the spec, you're guessing.
- "Can I cite the file path I learned this from?" If no, the source isn't durable enough.
- "Does this reference repo's version of the pattern still work today?" Run it once before adopting.

This is the input-side companion to [[prove-it-works]]: that principle says verify your output against reality; this one says source your knowledge from reality.
