---
author: Alexander Opalic
pubDatetime: 2026-04-26T00:00:00Z
title: "How to automate accessibility testing on any frontend project"
description: "A framework-agnostic recipe for catching accessibility regressions before they ship. Combines axe-core component tests, Lighthouse CI page audits, a coverage gate, and lint-time rules."
tags: ["accessibility", "testing", "ci", "tooling"]
draft: true
---

Since 28 June 2025, accessibility is a hard legal requirement in
the EU. The European Accessibility Act ([Directive 2019/882](https://eur-lex.europa.eu/eli/dir/2019/882/oj/eng))
is blunt about it:

> Member States shall ensure... that economic operators only place
> on the market products and only provide services that comply with
> the accessibility requirements set out in Annex I.

That covers e-commerce, banking, transport ticketing, e-books, and
most consumer-facing digital services. The technical bar is WCAG 2.1
Level AA via the harmonized standard EN 301 549. Miss it and you're
looking at fines, market removal, or both.

And yet most sites I open still ship missing alt text, custom
selects keyboard users can't escape, contrast that fails the moment
you hover. The gap between what the law requires and what production
frontends actually deliver is enormous.

The good news: closing most of that gap is automatable. axe-core in
component tests, Lighthouse CI on built pages, a coverage gate, a
few lint rules — together they catch the bulk of WCAG violations
before they ship. They won't make a site fully accessible. You still
need a11y experts and real assistive-tech users for the judgment
calls. But automation stops you re-shipping the same regressions
every quarter.

This post walks through the setup the [npmx.dev](https://npmx.dev)
project uses. It's the cleanest production-grade a11y testing
strategy I've seen in an open-source repo, and most of the patterns
generalize across frameworks. We go layer by layer. For the wider
context this fits into, see [my modern frontend quality pipeline](/blog/modern-frontend-quality-pipeline).

## Before you start

This guide assumes you have:

* A CI pipeline you can add jobs to (GitHub Actions, GitLab CI, etc.).
* A component test runner. The examples use **Vitest in browser mode**
  with Playwright; Cypress component testing or Web Test Runner work
  too.
* A build step that produces a previewable site (`pnpm preview`,
  `next start`, `astro preview`, etc.).
* Optional: a CSS framework with a custom-rule API (Tailwind, UnoCSS)
  for the lint-time layer.

If you only have one of these, start with the layer it enables and add
the rest later. Each step below is useful on its own.

## Why one tool is never enough

Accessibility bugs live at different layers of an app. No single
tool sees all of them:

- **Page-level issues:** landmarks, heading order, document
  language, color contrast in context. You only see these on a fully
  rendered page.
- **Component-level issues:** missing `aria-label`, broken
  focus order inside a dropdown, an icon button with no accessible
  name. These show up before a component reaches a page.
- **Class- or token-level issues:** an `8px` font size, a
  `text-gray-400` on `bg-gray-300`. A linter can catch these the
  moment you type them.
- **Coverage drift:** the new component someone added last
  week that has no a11y test at all.

Mapped to the tools that catch each one:

Pick one tool and you cover one layer. The steps below cover all
four, cheaply, on every change. Run cheap checks first; let the
expensive ones gate what they have to.

## Set up the pipeline

### 1. Run axe-core in component tests

Start here. **`axe-core`** is the de-facto a11y rule engine — it's
what Lighthouse, Storybook's a11y addon, and most browser extensions
use under the hood. Run it in your component tests and every new
component gets a per-component verdict in seconds. For a Vue-specific
walkthrough using Testing Library and jest-axe, see [my earlier post on jest-axe in Vue](/blog/how-to-improve-accessibility-with-testing-library-and-jest-axe-for-your-vue-application).

The 2026 setup:

- **Vitest in browser mode** (Playwright-driven Chromium) so
  components mount in a real DOM with real layout, focus, and
  keyboard behaviour. `jsdom` will pass tests that fail in a real
  browser — don't use it for a11y.
- **`axe-core`** loaded as a global. One helper that mounts the
  component into an isolated container and runs `axe.run` against it.
- **Disable page-level rules** when testing isolated components.
  Rules like `landmark-one-main`, `region`, `page-has-heading-one`,
  and the duplicate-landmark family are correct on a page but
  meaningless on a single component. Leave them on and the noise
  trains the team to ignore axe output.
- **Fail on unexpected `console.warn`** in the same hook. Invalid
  props cause framework warnings that axe never sees but that point
  at real bugs.

A minimal helper:

```ts
import 'axe-core'
import type { AxeResults, RunOptions } from 'axe-core'

declare const axe: { run: (el: Element, opts?: RunOptions) => Promise<AxeResults> }

const axeOptions: RunOptions = {
  resultTypes: ['violations'],
  rules: {
    'landmark-one-main': { enabled: false },
    'region': { enabled: false },
    'page-has-heading-one': { enabled: false },
    'landmark-no-duplicate-banner': { enabled: false },
    'landmark-no-duplicate-contentinfo': { enabled: false },
  },
}

export async function runAxe(wrapper: { element: Element }) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  container.appendChild(wrapper.element.cloneNode(true))
  const result = await axe.run(container, axeOptions)
  container.remove()
  return result
}
```

Then in each test:

```ts
expect((await runAxe(wrapper)).violations).toEqual([])
```

Every new component now gets tested in seconds, in parallel, with
the same engine that powers your page-level audits. If you're new to
Vitest browser mode, my [Vue 3 testing pyramid guide](/blog/vue3_testing_pyramid_vitest_browser_mode) covers the setup.

### 2. Add a coverage gate

Running the tests is easy. The hard part is making sure new
components don't slip past them. A small meta-test fixes this:

1. List every component file under `src/components/` (or your
   framework's equivalent).
2. Parse your test file to find which components are imported and
   tested.
3. Maintain a `SKIPPED_COMPONENTS` map where each entry **must** have
   a written justification (e.g. *"server-rendered OG image, not
   interactive UI"*).
4. Fail the test if a component is neither tested nor explicitly
   skipped.
5. Also fail on **obsolete** skip entries (component no longer
   exists) and **unnecessary** skips (component is now tested).

The gate's logic, in one picture:

<A11yCoverageGateLogicDiagram />

This turns a soft convention into a hard gate. You can't merge a new
component without either adding an a11y test or writing down why it
doesn't need one. The justification field is the thing that stops
the skip list from becoming a dumping ground.

If your framework generates a component manifest (Nuxt's
`.nuxt/components.d.ts`, Astro's auto-imports, etc.), parse that
instead of guessing naming conventions. It's the source of truth
your framework uses.

### 3. Audit pages with Lighthouse CI

Component tests miss the issues that only surface once the whole
page renders: heading order across sections, landmark structure,
contrast against the rendered background, focus order through a real
layout. **Lighthouse CI** (`@lhci/cli`) runs Lighthouse against a
built preview and asserts a score.

Three details that bite people:

- **Run it against a build, not the dev server.** Dev mode includes
  warning banners, hot-reload overlays, and unminified output that
  skew results.
- **Audit both color schemes.** Set the color mode in a Puppeteer
  pre-script (write to `localStorage` before navigation) and run the
  matrix `[dark, light]`. Contrast regressions show up in one mode
  more often than both. Running one halves your detection.
- **Mock the network.** Use CDP's `Fetch.enable` domain to fulfil
  requests from fixtures. This avoids two failure modes: flaky
  third-party APIs breaking your CI, and audits varying based on
  what the live API returned that minute. Use the same fixtures your
  E2E tests use so behaviour stays consistent.

Configure strict assertions:

```js
// .lighthouserc.cjs
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview',
      startServerReadyPattern: 'Listening',
      url: ['http://localhost:3000/', 'http://localhost:3000/key-route'],
      puppeteerScript: './lighthouse-setup.cjs',
      settings: { onlyCategories: ['accessibility'] },
    },
    assert: {
      assertions: { 'categories:accessibility': ['error', { minScore: 1 }] },
    },
  },
}
```

`minScore: 1` is aggressive on purpose. Anything less than perfect
fails CI. In practice the score is binary — you either fix the
issue or tighten the rule list. Set "minimum 0.9" and the gate
slips quarter by quarter until nobody trusts it.

> 
Lighthouse runs its own Puppeteer interception. If you also call
`page.setRequestInterception(true)` you'll get *"Request is already
handled!"* errors. Attach to the browser via CDP `Fetch.enable`
instead. It operates underneath Lighthouse's layer and avoids
the conflict.

### 4. Run axe in E2E tests with Playwright

Component tests catch isolated issues. Page audits catch full-page
issues. E2E catches the messy middle — focus order *across*
components, a modal stacked over the wrong parent, contrast that
depends on which route loaded first.

[`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
is the official Deque integration and the de-facto pick in 2026:

```ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('homepage has no a11y violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
```

Two practical notes:

- **Reuse the built preview your E2E suite already starts** — the
  same one Lighthouse audits against. Don't spin up a separate
  server.
- **Re-enable the page-level rules you disabled in component tests.**
  `landmark-one-main`, `region`, `page-has-heading-one`, and the
  duplicate-landmark family all *should* run here. That's the whole
  reason E2E a11y exists as a separate layer.

Unlike Lighthouse, this layer tells you *which test path* hit the
violation, not just the URL — useful when the broken page is one
only authenticated users can reach.

### 5. Catch token-level issues at lint time

Some a11y issues are predictable from source alone: text too small
to read, contrast pairs known to fail, motion-sensitive classes used
outside `prefers-reduced-motion` guards. A linter catches these
before any test runs.

If you use Tailwind or UnoCSS, write a small custom preset that
warns on hostile classes. UnoCSS makes this easy — a preset is a
function returning rules, and a "checker" hook flags patterns at
build time:

```ts
export function presetA11y(): Preset {
  return {
    name: 'a11y-preset',
    rules: [
      [
        /^text-\[(\d+)px\]$/,
        ([, px]) => {
          if (Number(px) < 12) {
            console.warn(`[a11y] Avoid 'text-[${px}px]'. Use text-2xs or larger.`)
          }
        },
      ],
    ],
  }
}
```

Run the same checker as a pre-commit hook on staged `.vue`, `.tsx`,
or `.svelte` files for instant feedback.

ESLint plugins like **`eslint-plugin-jsx-a11y`** (React),
**`eslint-plugin-vuejs-accessibility`** (Vue), and
**`eslint-plugin-svelte`**'s a11y rules cover the language side —
`alt` on `img`, `for` on `label`, `role` validity, and so on. They
look at source, not rendered DOM, so they don't replace axe. They
catch the obvious bugs in milliseconds.

### 6. Add Storybook addon-a11y for manual review

The previous five steps run automatically. Storybook's
**`@storybook/addon-a11y`** is the manual counterpart — a panel on
each story that runs axe live, shows violations with element
highlights, and lets a designer or PM verify a component without
touching CI logs.

It complements the automated tests rather than replacing them. The
moment someone spots a violation in Storybook that axe didn't flag
in CI, you've found a gap to close in the test config.

If you already use Chromatic for visual regression,
[**Storybook 9 + Chromatic Accessibility**](https://www.chromatic.com/docs/accessibility/)
now baselines axe violations per branch the same way it baselines
visual diffs — turning the addon-a11y panel from a manual review
tool into a CI gate.

### 7. Enable dev-time a11y warnings

More frameworks now ship dev-time a11y modules that surface warnings
in the browser console as you build:

- **Nuxt:** [`@nuxt/a11y`](https://github.com/nuxt/a11y) (first-party,
  axe-core powered, runs in dev and surfaces violations in a Nuxt
  DevTools tab)
- **Astro:** built-in dev toolbar a11y app
- **SvelteKit:** Svelte's built-in a11y compiler warnings
- **React (Next.js, Remix, React Router v7, TanStack Start):**
  [`@axe-core/react`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react)
  for runtime warnings in the console, plus
  **`eslint-plugin-jsx-a11y`** and the React DevTools accessibility
  tree.
- **Angular:**
  [`@axe-core/angular`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/angular)
  for runtime audits in the console; `@angular/cdk/a11y` provides
  accessible primitives but not warnings.

These don't gate CI, but they shorten the feedback loop so issues
get fixed at write-time instead of review-time. Frameworks without a
maintained dev-time option (standalone Vue, Solid, Qwik, Ember) can
rely on the lint and component-test layers above.

## Putting it together

What this looks like on a typical PR:

| Layer | Tool | Where | Gates CI? |
|---|---|---|---|
| Source rules | `eslint-plugin-jsx-a11y` / framework equivalent | Pre-commit + CI lint job | ✅ |
| Design tokens | Custom UnoCSS / Tailwind preset | Pre-commit + unit test | ✅ |
| Component a11y | `axe-core` in Vitest browser mode | CI component tests | ✅ |
| Coverage gate | Custom meta-test | CI unit tests | ✅ |
| Page audit | Lighthouse CI (light + dark) | CI a11y job | ✅ |
| E2E a11y | `@axe-core/playwright` | CI E2E job | ✅ |
| Story review | `@storybook/addon-a11y` (+ Chromatic) | Local Storybook / Chromatic | ❌ (✅ with Chromatic) |
| Dev-time | Framework a11y module | `pnpm dev` | ❌ |

Seven automated layers, one manual (two if you skip Chromatic).
Each catches a different class of bug. Each runs at the cheapest
stage it can. Together they turn a11y into the kind of thing that
breaks the build — and that's the kind of thing teams fix.

## Adjacent tools worth knowing

The pipeline above uses only free, open-source tools. A few adjacent
options are worth a mention before you build:

- **[axe DevTools Linter](https://www.deque.com/axe/devtools/linter/):**
  Deque's commercial IDE/CI linter. The paid upgrade path from
  `eslint-plugin-jsx-a11y` if you want richer rule coverage and
  template-aware analysis for JSX, Vue, Angular, and HTML.
- **[IBM Equal Access Checker](https://github.com/IBMa/equal-access):**
  free, open source, with Playwright/Selenium/Puppeteer CI packages.
  An *independent* rule engine. Useful as a "second opinion"
  alongside axe-core when you want to catch what one engine misses.
- **AI-assisted a11y reviewers:** a 2026 category. Tools like
  `a11y-lint` and `a11yscout` (a GitHub Action) wrap axe with
  LLM-driven checks for ambiguous labels, reading order, and other
  judgment calls axe misses on its own. Nascent. Mention rather than
  recommend until the false-positive rates settle.

## What this *doesn't* catch

Automation has limits. Axe and Lighthouse together catch roughly
30&ndash;50% of WCAG issues — the rest need human judgment:

- **Screen-reader UX.** Axe confirms an element has a name. A
  screen-reader user confirms the name is *useful*.
- **Keyboard journeys.** Tests assert focusability. They don't
  assert that the focus *order* makes sense.
- **Cognitive load.** Reading level, error message clarity, and form
  recovery are WCAG concerns no rule engine measures.

Budget for periodic manual audits with users of assistive technology
when you can. Your pipeline keeps those audits from re-finding the
same regressions every quarter. For a broader checklist of what to
cover beyond the pipeline, see my [Vue accessibility blueprint](/blog/vue-accessibility-blueprint-8-steps).

## Takeaways

- **Layer your tools.** axe-core in component tests, Lighthouse CI
  on built pages, ESLint and design-token checks at lint time —
  each catches a class of bug the others can't.
- **Test in a real browser.** `jsdom` will pass a11y tests that fail
  in production. Use Vitest browser mode with Playwright-driven
  Chromium.
- **Set Lighthouse to `minScore: 1`.** Set "minimum 0.9" and the
  gate slips quarter by quarter. Binary pass/fail forces the fix.
- **Audit dark and light.** Most contrast regressions show up in one
  mode. Running both halves your detection time.
- **Add a coverage gate with justifications.** It's the one mechanism
  that stops new components from skipping the pipeline unnoticed.

## Start with one layer

You don't need the full pipeline to start catching real bugs. Pick
your most-used button or input, write the helper from step 1,
assert zero violations, ship. Once that test is green, the rest of
the layers earn their place one PR at a time.

---

*Most of the patterns above are lifted from the open-source pipeline
running on [npmx.dev](https://npmx.dev) — their axe helper, coverage
gate, Lighthouse setup, and UnoCSS preset are all in the
[npmx.dev GitHub repo](https://github.com/npmx-dev/npmx.dev). Worth
a read if you want to see the full thing wired up.*
