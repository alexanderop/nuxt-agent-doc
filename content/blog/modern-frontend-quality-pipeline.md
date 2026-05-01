---
author: Alexander Opalic
pubDatetime: 2026-04-25T00:00:00Z
title: "A Modern Quality Pipeline and Testing Strategy for Frontend Projects"
description: "A short, framework-agnostic concept of what a modern quality pipeline and testing strategy look like for any JavaScript or TypeScript frontend project."
tags: ["testing", "tooling", "ci", "performance", "observability"]
draft: false
---

An agent writes most of my frontend code now. I review what it produces and tighten the architecture where it overreaches.

That changes what a quality pipeline is for. You used to write tests and types so the next person on the file stayed sane. Now you write them so the agent can check its own work. Give it more ways to verify a change (types, lint, unit, component, real browser, a11y, bundle budget) and it finishes more of the ticket on its own. A red check tells it what to try next.

Frontend has also grown more complicated since 2024. SSR, streaming, partial prerendering, server components, edge runtimes. Each adds a place where a change can break silently. "TypeScript plus a couple of unit tests" no longer covers it.

A *quality pipeline* is the set of checks that run on every change (locally, on commit, in CI) to give layered confidence the change is correct, accessible, performant, and safe to ship. A *testing strategy* is the part of that pipeline that asserts behaviour: what the app should do, at which level, at what cost.

Plan them as one system. The pipeline decides when checks run; the strategy decides which checks are worth running. Design them together so that:

- Each check has a clear job and runs at the cheapest stage where it can
  catch the problem.
- The feedback loop is short enough that no developer or agent skips
  ahead.
- The same checks run on a contributor's laptop, in an agent's sandbox,
  and on the CI runner.

The same pipeline shape applies whether you build with Next, Nuxt, Astro, SvelteKit, Remix, or a plain Vite app. The framework choice changes which adapter you import, nothing else.

## Background

Frontend tooling consolidated between 2023 and 2026. [Vite](https://vitejs.dev/)
became the default dev/build engine across the major frameworks.
[Vitest](https://vitest.dev/) replaced [Jest](https://jestjs.io/).
[Playwright](https://playwright.dev/) became the default for E2E.
[ESLint](https://eslint.org/) adopted flat config; [Biome](https://biomejs.dev/)
and **[Oxlint](https://oxc.rs/docs/guide/usage/linter)** emerged as much faster
alternatives in Rust. [TypeScript](https://www.typescriptlang.org/) strict mode
became table stakes. [Renovate](https://docs.renovatebot.com/) replaced
[Dependabot](https://github.com/dependabot). In March 2026,
[VoidZero](https://voidzero.dev/) shipped **[Vite+](https://viteplus.dev/)** as
the open-source culmination of that trend: one CLI that wraps Vite,
[Rolldown](https://rolldown.rs/), Vitest, Oxlint,
[Oxfmt](https://github.com/oxc-project/oxc), and [Tsdown](https://tsdown.dev/).

A modern quality pipeline's pieces look the same regardless of framework, so I'll describe the concept first and my stack second.

## My default stack

For new frontend projects in 2026 I reach for **Vite+** instead of wiring
the toolchain by hand. Vite+ ([viteplus.dev](https://viteplus.dev/)) is
the unified toolchain from VoidZero, [Evan You](https://evanyou.me/)'s company.
It bundles Vite, Rolldown, Vitest, Oxlint, Oxfmt, and Tsdown behind a single
CLI (`vp dev`, `vp check`, `vp test`, `vp build`) and one config file. The
alpha shipped open source under MIT.

If you adopt the pieces one at a time, the swaps I would make are:

| Old default | What I use | Why |
| --- | --- | --- |
| ESLint | **Oxlint** | ~50&times; faster, fast enough to run on every keystroke |
| [Prettier](https://prettier.io/) | **Oxfmt** | ~30&times; faster, Prettier-compatible defaults |
| Jest | **Vitest** | ESM-native, browser mode, same matchers |
| [webpack](https://webpack.js.org/) | **Vite + Rolldown** | ~40&times; faster production builds |
| four separate configs | `vp check` / `vp test` / `vp build` | one CLI, one config |

Each piece holds up on its own. I have shipped Vitest and Oxlint in
production for some time; swapping Prettier for Oxfmt and webpack for
Rolldown took a day in the projects I tried. Vite+ removes the
integration cost that kept teams on the older stack.

## The layers

Think of the pipeline as concentric layers, each cheaper and faster than
the one outside it. Run cheap checks first. Save the expensive ones for
the things only they can catch.

### 1. Type safety

Type safety is your first line of defence. Run your framework's type
checker in CI on every PR. Treat any new type error as a build failure.

If you use TypeScript, that means `tsc --noEmit` (or your framework's wrapper around it; most frameworks ship one to handle their template syntax and project references). If you don't use TypeScript yet, adopting it is the highest-leverage change you can make.

Validate untyped boundaries with a schema library ([Zod](https://zod.dev/), [Valibot](https://valibot.dev/), [ArkType](https://arktype.io/)). Parse anywhere data crosses a boundary: route params, API responses, env vars, form input. TypeScript trusts the types you write; schemas check that the data matches them at runtime. With runtime parsing in place you stop reaching for `as`. See [why `as` is a shortcut to avoid](/blog/the-problem-with-as-in-typescript-why-its-a-shortcut-we-should-avoid).

### 2. Lint and format

Catches style and a wide class of bugs (unused vars, unsafe `any`, missing
deps in effects) without running the code.

The conventional choice is ESLint flat config plus
[`typescript-eslint`](https://typescript-eslint.io/) and your framework's plugin. The 2026 alternative is **Oxlint** (Rust-based,
~50&times; faster) paired with Oxfmt for formatting, or **Biome** for a
single-binary lint+format combo. The trade-off: Oxlint and Biome have
smaller rule sets than ESLint's mature ecosystem, but they cover most of
the high-value cases and are fast enough to run on every keystroke. For a
working setup that uses Oxlint as a fast first pass and keeps ESLint for
the rules Oxlint doesn't yet cover, see [my opinionated ESLint setup for Vue projects](/blog/opinionated-eslint-setup-vue-projects).

Add these two rule families regardless of which linter you pick. They
catch bugs the type system misses:

- **[`eslint-plugin-regexp`](https://ota-meshi.github.io/eslint-plugin-regexp/)** &ndash; ~60 correctness rules for regular
  expressions. Cheap to add, catches real bugs.
- **[`@e18e/eslint-plugin`](https://e18e.dev/)** &ndash; small performance lints (e.g., prefer
  `Set.has` over `Array.includes`) that compound across a codebase.

### 3. Unit tests

For pure functions, hooks, stores, and utilities. Cheap, fast, and where
most logic should live.

- **Tool:** Vitest. Run on every save in watch mode; run all of them in CI.
- Aim for high coverage of pure modules; don't chase coverage on UI glue.

For Vue, see my [guide to testing Vue composables with Vitest](/blog/how-to-test-vue-composables).

### 4. Component tests

For components in isolation, with a real DOM and real user interactions. The biggest win in 2026 is **Vitest browser mode**: your component tests run in a real Chromium via Playwright instead of jsdom. Hover states, focus, layout, intersection observers, and scroll behaviour all work as they do in production.

Pair this with [`@testing-library/*`](https://testing-library.com/) for
whichever framework you use; accessibility assertions on each mounted
component live in layer 8 below. For a deeper walkthrough of how this
fits into a full testing pyramid, see [my Vue 3 testing pyramid guide](/blog/vue3_testing_pyramid_vitest_browser_mode).

### 5. API mocking

Hard-coded fixtures go stale. Tests that hit a real backend are flaky.
Mock at the network layer once and reuse the same handlers everywhere.

- **Tool:** **[MSW](https://mswjs.io/)** (Mock Service Worker). It intercepts `fetch`,
  XHR, and GraphQL with a service worker in the browser and a
  request interceptor in Node, so the same handler definitions
  work in Vitest, Vitest browser mode, Playwright, and the dev
  server.
- Define handlers once in `src/mocks/handlers.ts`; load them in
  your test setup and (optionally) in the dev server for
  offline-first development.
- Combined with Zod (or Valibot/ArkType) schemas at the same
  boundary, you get mocks that are typed, schema-validated, and
  shared across every layer that hits the network. One source of
  truth instead of three drifting fixture folders.

### 6. Contract testing

The mocks in layer 5 are only as good as the assumptions you bake into them. If the backend renames a field or changes a status code without telling you, every green unit and component test still passes while production breaks. Contract testing closes that gap by tying the mock to a verifiable artefact that the provider checks against.

There are three styles, and they fit different team setups.

**Consumer-driven contracts ([Pact](https://pact.io/)).** The frontend
writes a test that records the requests it makes and the responses it
expects. Pact generates a JSON contract and publishes it to a broker
(the open-source [Pact Broker](https://docs.pact.io/pact_broker), or
hosted [PactFlow](https://pactflow.io/)). The provider runs *its* real
test suite against that contract; if it satisfies every recorded
interaction, both sides can deploy. Pact has libraries for JS/TS, JVM,
.NET, Go, Rust, Python, Ruby, PHP, and Swift, so the same broker spans
a polyglot estate. Best when you control both ends of the wire and want
the consumer to drive the schema.

**Provider-driven / OpenAPI-based.** The provider publishes an
[OpenAPI](https://www.openapis.org/) spec and the contract *is* the
spec. Consumers validate their requests and assertions against it with
[Schemathesis](https://schemathesis.readthedocs.io/) (property-based
fuzzing of every operation), [Dredd](https://dredd.org/) (replays
example requests from the spec against the running provider), or
[Spectral](https://stoplight.io/open-source/spectral) (lints the spec
itself). Best when the provider already maintains an OAS and you don't
want to add Pact on their side.

**Bi-directional contracts ([PactFlow](https://docs.pactflow.io/docs/bi-directional-contract-testing)).**
The consumer publishes a Pact contract; the provider publishes its
OpenAPI spec; PactFlow proves the two are compatible without the
provider having to run consumer-supplied tests. Best when consumers
want consumer-driven semantics but the provider team won't (or can't)
run Pact verification themselves.

What you get for the work:

- **Independent deploys.** A contract gate replaces "is the matching
  E2E green?" with "does the provider satisfy every consumer's
  contract?". Consumer and provider can ship on different cadences
  without coordinating a release train.
- **Faster than E2E.** Verifying a contract is a unit test for the
  boundary; E2E spins up the real services. You catch the same class
  of bug an order of magnitude sooner.
- **Catches drift the linter can't.** A field renamed on the backend
  fails the contract before MSW handlers or Playwright flows would
  notice.

Skip this layer if you own both services and ship them as one unit. E2E covers the same boundary in that case, and the contract overhead doesn't pay off. Add it the moment consumer and provider deploy on different cadences, you don't own the provider, or a single backend serves multiple frontends that all need to keep working.

For a deep dive, [*Contract Testing in Action*](https://www.oreilly.com/library/view/contract-testing-in/9781633437241/)
(Marie Cruz & Lewis Prescott, Manning) walks through Pact, bi-directional
contracts, and how to introduce the practice without stalling delivery.

### 7. End-to-end tests

<E2ELayerDiagram />

For critical user journeys across real pages: signup, checkout, the one or two flows that must never break. Keep the suite small. E2E is expensive.

- **Tool:** Playwright.
- Run against a built preview, not the dev server.
- Two assertions worth wiring into a custom fixture, regardless of
  framework, because they catch silent regressions:
  - **Hydration mismatches.** Listen for hydration warnings on `console`
    and fail the test if any appear. SSR/CSR drift is one of the most
    common silent regressions in modern frameworks. I wrote a dedicated
    post on
    [catching hydration errors in Playwright tests](/blog/catch-hydration-errors-playwright-tests)
    with a reusable fixture.
  - **CSP violations.** Listen for `securitypolicyviolation` events. If
    your CSP is real, this turns every E2E run into a CSP regression
    test.

### 8. Accessibility

Accessibility cuts across lint, component, E2E, and preview. Treat it as a single discipline and check the same WCAG rule set at every cheap-enough stage.

- **Lint.** [`eslint-plugin-jsx-a11y`](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
  (React/JSX), [`eslint-plugin-vuejs-accessibility`](https://github.com/vue-a11y/eslint-plugin-vuejs-accessibility)
  (Vue), [`eslint-plugin-astro`](https://ota-meshi.github.io/eslint-plugin-astro/) — catch
  missing `alt`, role mismatches, and other static violations before tests run.
- **Component.** [`axe-core`](https://github.com/dequelabs/axe-core) via
  [`jest-axe`](https://github.com/nickcolley/jest-axe) for jsdom, or
  [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm) in Vitest browser mode.
  Assert no violations on every mounted component, and add a meta-test that fails if any
  component test lacks an a11y assertion so the practice doesn't slide.
- **E2E.** [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm) on each critical
  journey — same engine as the component layer, but on the real composed page where many
  violations only appear once everything is wired together.
- **Preview.** Lighthouse's accessibility category (run as part of layer 10) or
  [Pa11y CI](https://github.com/pa11y/pa11y-ci) on a list of routes for a dedicated, auditable
  report.
- **Manual.** Storybook's [a11y addon](https://storybook.js.org/addons/@storybook/addon-a11y),
  keyboard-only walkthroughs of new flows, and screen-reader spot-checks. Automated tools catch
  roughly 30% of WCAG issues; the rest needs a human.

This is no longer optional in the EU: the
[European Accessibility Act](https://ec.europa.eu/social/main.jsp?catId=1202) took effect in
mid-2025, so most B2C and many B2B products operating in EU markets are now legally required
to meet WCAG 2.1 AA equivalence. For a framework-specific checklist, see
[my Vue accessibility blueprint](/blog/vue-accessibility-blueprint-8-steps).

### 9. Visual regression

Catches unintended UI drift that unit and E2E tests miss.

- [Chromatic](https://www.chromatic.com/) (hosted,
  [Storybook](https://storybook.js.org/)-native) or Playwright screenshots + a
  diff tool like [Lost Pixel](https://lost-pixel.com/) for self-hosted. For a Vitest-native approach, see
  [how to do visual regression testing in Vue with Vitest](/blog/visual-regression-testing-with-vue-and-vitest-browser).
- `onlyChanged: true` keeps it cheap: only re-snapshot stories whose
  dependencies changed.
- Gate on PR; review diffs as part of code review.

### 10. Performance and bundle size

Performance regressions are silent unless you measure them.

- **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)** on a
  preview deployment. Run it against both a *light* and *dark* color scheme;
  contrast regressions show up only in one.
- [`size-limit`](https://github.com/ai/size-limit) or your framework's bundle
  analyzer on PR for bundle deltas. Set explicit budgets and fail the build
  when they're exceeded.

Lab measurements catch regressions before merge. To see what real
users experience, and to find bottlenecks while you're writing the
code, see layer 15 below.

### 11. Dead code and dependency hygiene

Unused code is a tax on every other check.

- **[Knip](https://knip.dev/)** to find unused files, exports, and
  dependencies. Configure per-workspace if you have a monorepo.
- **Renovate** for automated dependency updates with grouping and a sane
  schedule.
- **[OSV-Scanner](https://google.github.io/osv-scanner/)** for vulnerabilities
  and **[Gitleaks](https://github.com/gitleaks/gitleaks)** for secrets, gated
  to high-severity only to avoid alert fatigue.
- Generate an **SBOM** (Software Bill of Materials) on every build with
  [Syft](https://github.com/anchore/syft), [Trivy](https://trivy.dev/), or
  [cdxgen](https://github.com/CycloneDX/cdxgen), in
  [CycloneDX](https://cyclonedx.org/) or [SPDX](https://spdx.dev/) format. This
  is shifting from "nice to have" to "regulated requirement" in 2026
  ([EU CRA](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act),
  US executive orders), and it's the same artefact your security team uses
  to answer customer vulnerability questionnaires.

### 12. Internationalisation drift

<I18nDriftLayerDiagram />

If you ship in more than one language, untranslated strings slip through. A mature i18n library plus a drift checker in CI catches them.

- **i18n libraries** &ndash; [i18next](https://www.i18next.com/),
  [vue-i18n](https://vue-i18n.intlify.dev/),
  [FormatJS / react-intl](https://formatjs.github.io/), and
  [Lingui](https://lingui.dev/) all expose a missing-key handler you can
  fail the build on, plus extractor CLIs that refuse to ship if a string
  has no translation entry.
- **Lint your source for hardcoded strings.** ESLint has
  [`eslint-plugin-i18next`](https://github.com/edvardchen/eslint-plugin-i18next)
  and
  [`@intlify/eslint-plugin-vue-i18n`](https://eslint-plugin-vue-i18n.intlify.dev/)
  to flag bare strings in JSX/templates and unused or missing keys.
  Oxlint doesn't yet ship i18n-specific rules, so run it as the fast
  first pass and keep these ESLint plugins for the i18n layer.
- **[Lunaria](https://lunaria.dev/)** compares each locale against a source
  locale and reports missing or stale keys. It works with any project that has translation
  files; you can publish a public status dashboard from the same data.

### 13. Preview deployments

The cheapest way to enable manual review and to give E2E, Lighthouse, and
visual-regression checks something realistic to run against.

- [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/), or
  [Cloudflare Pages](https://pages.cloudflare.com/) will give you a unique URL
  per PR for free.
- Wire your downstream checks to that URL.

### 14. Automated code review

In 2026, AI code review is a standard pipeline stage. It runs before any
human reviewer touches the PR and catches issues the layers above miss:
logic mistakes, missing edge cases, security smells, and the small
inconsistencies that lint rules can't express.

- **[CodeRabbit](https://www.coderabbit.ai/)**,
  **[Greptile](https://www.greptile.com/)**, and
  **[Vercel Agent](https://vercel.com/docs/agent)** are the main options. Recent benchmarks put Greptile's bug-catch rate around 82%
  versus CodeRabbit's ~44%, but Greptile produces more false positives
  and runs slower; CodeRabbit covers more git platforms.
- Have it run alongside specialist scanners (secrets, vulnerabilities,
  workflow lint, shell/yaml lint) so a single bot comment summarises
  every machine-checkable concern on the PR.
- Pause the bot on Renovate / Dependabot PRs to avoid noise on
  mechanical updates.

Treat the AI reviewer as a high-recall first pass that reduces human review without replacing it. If you want to add an AI agent that goes one step further and exercises the app in a real browser, see [how I run automated QA with Claude Code, Agent Browser, and GitHub Actions](/blog/automated-qa-claude-code-agent-browser-cli-github-actions).

### 15. Runtime observability

Layers 1&ndash;13 give you confidence at merge time. Once a change is in
production, and while you're writing it, you also want a live view of
what the app is doing. The same instrumentation answers both questions.

Use **[OpenTelemetry](https://opentelemetry.io/)** as the SDK. It's the
only vendor-neutral option, and the JS ecosystem caught up in 2025&ndash;2026:
stable web SDK, official auto-instrumentations for `document-load`,
`fetch`, `xhr`, and `user-interaction`, and OTLP support in every backend
that matters.

- **Browser SDK.** [`@opentelemetry/sdk-trace-web`](https://www.npmjs.com/package/@opentelemetry/sdk-trace-web)
  plus the auto-instrumentations emits OTLP/HTTP. Wrap
  [`web-vitals`](https://github.com/GoogleChrome/web-vitals) into OTel
  metrics so LCP/INP/CLS land on the same backend as the trace that
  produced them. One pipe instead of two.
- **SSR / edge.** Next, Nuxt, SvelteKit, and Astro all expose OTel hooks.
  Set a single `service.name` resource attribute and one request stitches
  together: edge &rarr; SSR &rarr; hydration &rarr; client interaction,
  all in one trace.
- **One collector, two backends.** Run an
  [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) with
  two exporters. In dev, point it at [Jaeger](https://www.jaegertracing.io/)
  or [Grafana Tempo](https://grafana.com/oss/tempo/) running via
  `docker-compose`; open `localhost:16686` and you can watch every fetch,
  render, and hydration span as you click through the app. In prod, swap
  the exporter to [Honeycomb](https://www.honeycomb.io/),
  [Grafana Cloud](https://grafana.com/products/cloud/),
  [Dash0](https://www.dash0.com/), or
  [Sentry's OTel ingest](https://docs.sentry.io/platforms/javascript/tracing/instrumentation/opentelemetry/).
  Same SDK, same instrumentations, different OTLP endpoint.
- **Sample, or pay.** `ParentBased(TraceIdRatioBased(0.05))` in prod,
  `AlwaysOn` in dev. Tail-sample at the collector to keep the slow and
  error traces and drop the rest, so the signal that matters survives
  without renting cloud storage for every render.

The dev-time payoff is the part most teams underuse. The next time
someone asks why a page is slow on a real device, you already have the
trace from when they loaded it.

## Where each layer runs

Same layers, different stages. Pick the cheapest stage where each check
can catch the problem.

| Stage                | What runs                                                       |
| -------------------- | --------------------------------------------------------------- |
| Editor               | Type checker LSP, linter, Vitest watch                          |
| Pre-commit           | Format and lint on staged files only                            |
| CI on PR             | Typecheck, full lint, unit, component, contract verify, build, knip, size-limit, AI review |
| CI on preview URL    | E2E, accessibility (axe + Lighthouse), visual regression        |
| Post-merge / nightly | Full E2E matrix, dependency updates, security scans, SBOM publish |
| Dev server / production | OpenTelemetry traces and metrics: live in dev, sampled in prod |

For wiring local hooks themselves, **[Lefthook](https://lefthook.dev/)** has
become the default modern alternative to
[Husky](https://typicode.github.io/husky/): a single Go binary, declarative
YAML config, and parallel execution of lint/format/test commands on staged
files. Commit a `lefthook.yml` to the repo, run `lefthook install` once, and
contributors get the same hook setup automatically. Pair it with
[`lint-staged`](https://github.com/lint-staged/lint-staged) (or Lefthook's
built-in `{staged_files}` substitution) so pre-commit only runs against the
files that changed. That fast-check pattern keeps the hook under a couple
of seconds.

**[Git 2.54](https://git-scm.com/)** added config-based hooks, which means a small project no
longer needs an external hook manager at all. You define hooks in
`.gitconfig` instead of as scripts under `.git/hooks`:

```ini
[hook "linter"]
   event = pre-commit
   command = pnpm exec oxlint --staged

[hook "format"]
   event = pre-commit
   command = pnpm exec oxfmt --check
```

Multiple hooks per event run in order. Disable a single hook with
`hook.<name>.enabled = false` (useful for opting one repo out of a
system-wide config), and list the active ones with `git hook list
pre-commit`. The traditional `.git/hooks/*` scripts still run last,
so existing setups keep working. For a small project this covers most
of what Lefthook does without an extra binary. Lefthook still has the
edge for parallel execution and staged-file substitution.

One valid alternative skips commit hooks and runs *everything* server-side in CI as required status checks. You trade a slower red-CI feedback loop for never blocking a contributor with a flaky local hook.

If GitHub Actions is the CI you're wiring this onto, [*GitHub Actions in Action*](https://www.manning.com/books/github-actions-in-action) (Kaufmann, Bos & de Vries, Manning) covers workflow design, reusable actions, matrix builds, secrets, and self-hosted runners. It pays off once you outgrow the default templates and start wiring the layers above into shared workflows.

## What this gets you

- **Regressions caught before merge.** A typed schema at the boundary plus
  a Playwright check on the critical path catches more shipped bugs than
  any single layer alone.
- **Refactors get safer.** Strict types and a healthy unit and component
  test suite let you change internals without breaking surface behaviour.
- **Onboarding gets shorter.** A new contributor can run one command, see
  green, and trust that CI will tell them if they break something.
- **No one becomes the bottleneck.** The pipeline enforces the standard
  for accessibility, performance, and i18n, so quality stops riding on a
  single contributor.

## Picking your testing shape

The layers above tell you *what* to run. They don't tell you *how much weight to give each one*. A solo dev shipping a Vite app needs a different mix than a fifty-engineer team coordinating across a dozen services.

The industry argues about this in shapes. The classical
**[Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)**
(Mike Cohn) puts most of the weight on unit tests and very little on
E2E. Kent C. Dodds'
**[Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)**
moves the weight to integration tests because frontend bugs live at the
component-interaction layer. Spotify's
**[Honeycomb](https://engineering.atspotify.com/2018/01/testing-of-microservices)**
pushes weight onto integrated and contract tests because in a microservices
world, isolation tests prove little and full E2E is brittle. The
**Ice-cream cone** is the anti-pattern you end up with by accident: lots of
slow E2E on top, almost nothing underneath.

The right answer is "it depends," but you can be precise about what
it depends on. As web.dev puts it in *Pyramid or Crab*, ["the testing
strategy that's right for your team is unique to your project's
context"](https://web.dev/articles/ta-strategies). Pactflow, from the
contract-testing camp, goes further: at scale, full E2E is
[a tax with diminishing returns](https://pactflow.io/blog/proving-e2e-tests-are-a-scam/)
once teams and services multiply.

The four inputs that change the answer most:

- **Team size.** Six developers can keep a real E2E suite green together;
  sixty cannot. Coordination cost is what kills E2E suites at scale.
- **Backend control.** If you don't own the backend, contract testing
  goes from "nice" to "the only way you can change anything safely".
- **Number of services in the flow.** Each new service multiplies the
  surface that has to be set up, seeded, and reset for an E2E run.
- **Deployment cadence.** A daily-merge team can't afford a flaky
  twenty-minute suite; a quarterly-release team can.

Pick yours and the shape that fits will appear:

The same pyramid that helps one team can block another from shipping. Pick the shape that fits your constraints.

## Picking your battles

You don't need every layer on day one. A reasonable order to add them:

1. TypeScript strict + a fast linter + a formatter, wired into Lefthook
   so format and lint run on staged files at commit time.
2. Vitest for utilities, run on PR.
3. MSW handlers for any module that hits the network, shared between
   tests and the dev server.
4. Playwright for the single most important user journey, with hydration
   and CSP listeners wired into a shared fixture.
5. Contract testing the moment consumer and provider deploy on different
   cadences. Pact if you control both sides, OpenAPI validation if the
   provider already publishes a spec.
6. Preview deployments and Lighthouse CI (light *and* dark).
7. OpenTelemetry traces and metrics. Point the SDK at a local Jaeger
   via `docker-compose` the moment a "why is this slow?" question takes
   more than five minutes to answer. Same SDK in prod (different OTLP
   endpoint) once you have real users.
8. Storybook + visual regression once the design system stabilises.
9. Accessibility audits in component tests and E2E.
10. Knip and bundle-size budgets once the codebase has weight.
11. i18n drift checking once you ship a second locale.
12. AI code review and SBOM generation once the project has external
    stakeholders to answer to: reviewers, customers, or compliance.

Each layer should pay for itself in caught regressions or saved review
time. Remove the ones that don't.

## Supply chain defaults

The pipeline above catches the bugs you write. None of it stops a compromised dependency from running code on your laptop. The 2025&ndash;2026 wave of [npm](https://www.npmjs.com/) attacks (Shai-Hulud, the [Rspack](https://rspack.dev/) postinstall cryptominer, the [axios](https://axios-http.com/) 1.14.1 hijack) made the package manager's defaults a real part of your security posture. I use **[pnpm](https://pnpm.io/)** on every new project. Three of its settings do most of the work.

**1. Lifecycle scripts blocked by default.** Since pnpm 10, `preinstall`
and `postinstall` scripts in dependencies do not run on `pnpm install`.
You opt specific packages in via `pnpm.onlyBuiltDependencies` in
`package.json`. Most historical supply chain payloads shipped through
postinstall, so this default removes one of the biggest attack vectors.

**2. `minimumReleaseAge`.** A pnpm 10.16+ setting that refuses to
resolve a published version until it is at least *N* minutes old. Set
it to `1440` (one day) or `10080` (one week) in `pnpm-workspace.yaml`.
Most compromised packages get detected and unpublished within hours,
so a 24-hour delay covers the common published-and-pulled incidents.
pnpm 11 makes one day the default. Use `minimumReleaseAgeExclude` for
the few internal or first-party packages you need to install the moment
they ship.

**3. `blockExoticSubdeps`.** Refuses transitive dependencies pinned to
git repositories or tarball URLs. Closes a common path for
typo-squatting and dependency confusion.

A minimal `pnpm-workspace.yaml` for a new project:

```yaml
minimumReleaseAge: 1440
blockExoticSubdeps: true
onlyBuiltDependencies:
  - esbuild
  - sharp
```

Pair this with **OSV-Scanner** and **Gitleaks** in CI (layer 11 of the
pipeline) and you cover both the install-time and the audit-time sides
of supply chain security.

## Related resources

If you want to read more or start implementing this:

**Tools**

- [Vite+](https://viteplus.dev/) &ndash; unified toolchain from VoidZero (Vite, Rolldown, Vitest, Oxlint, Oxfmt, Tsdown)
- [pnpm supply chain security](https://pnpm.io/supply-chain-security) &ndash; the full list of defaults and settings discussed above
- [Vitest](https://vitest.dev/) &ndash; including [browser mode](https://vitest.dev/guide/browser/)
- [Playwright](https://playwright.dev/)
- [MSW](https://mswjs.io/) &ndash; network-level API mocking for browser and Node
- [Pact](https://pact.io/) and [PactFlow](https://pactflow.io/) &ndash; consumer-driven and bi-directional contract testing
- [Schemathesis](https://schemathesis.readthedocs.io/), [Dredd](https://dredd.org/), [Spectral](https://stoplight.io/open-source/spectral) &ndash; OpenAPI-based contract testing and linting
- [Lefthook](https://lefthook.dev/) &ndash; fast Git hooks manager (modern Husky alternative)
- [Storybook](https://storybook.js.org/)
- [Knip](https://knip.dev/)
- [Oxlint](https://oxc.rs/docs/guide/usage/linter)
- [Biome](https://biomejs.dev/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Lunaria](https://lunaria.dev/) &ndash; i18n drift detection
- [size-limit](https://github.com/ai/size-limit)
- [axe-core](https://github.com/dequelabs/axe-core)
- [Syft](https://github.com/anchore/syft) &ndash; SBOM generation
- [CodeRabbit](https://www.coderabbit.ai/), [Greptile](https://www.greptile.com/) &ndash; AI code review

**Reference**

- [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) &ndash; Ham Vocke's canonical write-up of Mike Cohn's pyramid.
- [The Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) &ndash; Kent C. Dodds' model for where to put the weight of your tests.
- [Testing of Microservices (Honeycomb)](https://engineering.atspotify.com/2018/01/testing-of-microservices) &ndash; Spotify's case for integrated tests over isolated unit tests in a microservices world.
- [Pyramid or Crab? Find a testing strategy that fits](https://web.dev/articles/ta-strategies) &ndash; web.dev on choosing a shape for your context.
- [Proving E2E tests are a scam](https://pactflow.io/blog/proving-e2e-tests-are-a-scam/) &ndash; Pactflow's contract-first counter-position.
- [Contract Testing in Action](https://www.oreilly.com/library/view/contract-testing-in/9781633437241/) &ndash; Marie Cruz & Lewis Prescott (Manning) on consumer-driven and bi-directional contracts in practice.
- [GitHub Actions in Action](https://www.manning.com/books/github-actions-in-action) &ndash; Kaufmann, Bos & de Vries (Manning) on workflows, reusable actions, matrix builds, and self-hosted runners.
- [Frontend testing guide: 10 essential rules for naming tests](/blog/frontend-testing-guide-10-essential-rules)
