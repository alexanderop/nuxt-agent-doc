# Layer the Monolith

> **Current state of this repo:** flat Nuxt app (`app/components`, `app/composables`, `app/pages`). The shape below is *aspirational* — apply when the codebase grows past the threshold where flat stops scaling. Don't assume the layout exists.

Scale a Vue/Nuxt codebase by layering it, not by splitting it across deployments. Nuxt Layers + atomic, feature-based folders give you the boundaries that microfrontends promise — without the runtime cost, build orchestration, or version-skew failure modes. Module federation is a last resort, not a default.

**Why:** Most "we need microfrontends" pain is actually "we have no internal boundaries." Layered monoliths give every team a private surface (its own layer or feature module) with a public contract (exports, routes, components), while keeping a single build, single deploy, single source of truth. You get isolation without distribution, and you can split later if a real boundary appears — the reverse direction is brutal.

**The Pattern:**

*Folder shape (atomic / feature-first):*
- `app/` (or `src/`) holds shells, routing, global providers — and nothing else.
- `features/<feature>/` is the atomic unit: `components/`, `composables/`, `stores/`, `pages/` (or routes), `api/`, `tests/`. A feature owns its slice end-to-end.
- `shared/` is for things genuinely used by ≥2 features — design system primitives, generic composables, types. Default to feature-local; promote to shared only when the duplication is real.

*Nuxt Layers as boundary enforcement:*
- A layer = a `nuxt.config.ts` + its own `pages/`, `components/`, `composables/`, `server/`. Extending it pulls those in with auto-import.
- Layers are how you split by *capability* (auth, billing, admin) or by *product surface* (marketing site vs. app shell) without cross-imports leaking concerns.
- A layer should be installable and deletable. If removing it requires touching ten unrelated files, the boundary leaked.

*Imports point inward:* ([[boundary-discipline]] at module scope)
- Features may import from `shared/`. `shared/` may not import from features.
- Two features must not import from each other directly. If they need to talk, the contract belongs in `shared/` or a parent layer — or one of them is the wrong shape.

**When to actually reach for module federation / microfrontends:**
- Independent deploy cadence is a hard requirement (different teams ship on different release trains, not just *prefer* to).
- Tech-stack divergence you cannot consolidate (one half is React, one half is Vue, and rewriting is off the table).
- Build times are unmanageable even after layering, code-splitting, and caching.

If none of those apply, layering is the answer.

**The Tests:**
- "Can I delete this feature folder and have the app build, with only `app/` and unrelated features touched?" If no, the feature is bleeding.
- "Does `shared/` know about a specific feature?" If yes, the dependency is reversed.
- "Are we adding a microfrontend to solve a problem that a layer would solve?" Almost always yes — try the layer first.
