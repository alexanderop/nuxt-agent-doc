---
title: "Writing Good Tests for Vue Applications"
author: "Alexander Opalic"
pubDatetime: 2026-04-25T00:00:00Z
sourceType: "book"
sourceAuthor: "Markus Oberlehner"
description: "A principle-driven guide to testing Vue apps. Argues for an Application-Test-heavy strategy with Vitest, Playwright, Testing Library and MSW, glued together by a driver pattern that decouples tests from any specific framework."
tags: ["testing", "vue", "tdd", "playwright", "vitest", "book-summary"]
draft: false
highlights:
  [
    {
      quote: "Testing can only prove the presence of bugs, not their absence.",
    },
    {
      quote: "Every test that can be automated should be automated.",
    },
    {
      quote: "What ultimately matters is finding a way to write stable and maintainable tests that provide feedback as quickly as possible on whether our code meets our requirements.",
    },
    {
      quote: "Decoupling from the test framework, from implementation details, and from the UI.",
    },
  ]
---

## Overview

The book lays out an opinionated approach to testing Vue applications, organised around two big ideas: **what kinds of tests to write and in what proportion**, and **how to structure tests so refactors don't break them**. The recommended stack is **Vitest + Playwright + Testing Library + Mock Service Worker (MSW)**.

## The four types of automated tests

The book defines four distinct categories, each with its own purpose:

1. **E2E System Tests**: exercise the full system, including real backend services and databases. Highest confidence at the highest cost.
2. **Application Tests**: exercise the entire Vue SPA from the user's perspective, with every external HTTP call mocked.
3. **Component Tests**: exercise a single Vue component in isolation. Fast and narrow.
4. **Unit Tests**: exercise extracted utility functions, classes, or modules. Not composables.

The book's headline rule: *every test that can be automated should be automated.* Manual testing covers exploratory work and usability checks. It shouldn't block deployments.

## How the book frames the testing pyramid

The classical pyramid for a Vue project looks like this:

```
       ▲  E2E (Cypress / Playwright)        few, slow, full system
      ▲▲  Integration                       some
    ▲▲▲▲  Unit (Jest, vue-test-utils)       lots, fast, narrow
```

The book rejects this shape. It treats both Pyramid and Trophy as starting points rather than prescriptions, and argues that feedback speed is what matters. The recommended distribution sits closer to Kent C. Dodds' Testing Trophy, but skewed further toward the user-perspective middle:

```
        ▲  manual exploratory   (continuous, non-blocking)
       ▲▲  E2E smoke tests      (1–5 critical paths)
     ▲▲▲▲  Application Tests    ← the bulk lives here
    ▲▲▲▲▲  Component + Unit     (only when they earn their place)
```

Three decisions follow from this:

- Reserve E2E System Tests for critical-integration smoke tests.
- Build the suite around **Application Tests**.
- Write Component and Unit Tests **only when the Application Test layer cannot give precise enough feedback**: a component with many edge cases of its own, or a pure function that deserves documentation through tests.

The book is explicit: don't test composables, stores, or plugins in isolation. The components or applications that use them cover them.

## What the book means by "Application Test"

*Application Test* is the book's most distinctive vocabulary, because the wider community overloads *Integration Test* and *E2E Test* with too many meanings. The book's definition is precise:

> An **Application Test** exercises the **entire Vue SPA inside a single repository**, from the user's point of view, while **mocking every HTTP call** to services outside the SPA.

Two properties separate this from a typical "integration test" or a Cypress E2E:

- **Boundary = the Git repo, not the system.** The router, Pinia stores, layouts, page components, composables, and fetching code: all real. The backend, database, Stripe, and the auth provider: all mocked at the network layer.
- **Tool-agnostic.** The same test should run in both jsdom and Playwright. The choice of runner is a feedback-speed lever.

Visually, the scope looks like this:

A concrete Application Test using Playwright reads like a user story, with `page.route()` standing in for the backend:

```ts
it('should be possible to buy a bike', async ({ page }) => {
  await page.route('/api/product/list', route =>
    route.fulfill({ json: [bestBikeEver, notSoGoodBike] }),
  );
  await page.route('/api/checkout', route =>
    route.fulfill({ json: { success: true } }),
  );

  await page.goto('https://my.bikestore');
  await page.findByText('Best Bike Ever').click();
  await page.findByRole('button', { name: 'Add to cart' }).click();
  await page.findByRole('button', { name: 'Checkout' }).click();

  expect(await page.findByText('Thank you for your order!').isVisible())
    .toBe(true);
});
```

What's missing here: no `mount(SomeComponent)`, no stubbing of child components, no assertions on Pinia actions. The test boots the real app, drives it through the UI, and asserts on visible outcomes. Compare that to a Component Test, which has a much narrower brief:

```ts
// Component Test — only PostForm, in isolation
it('should warn the user when they enter invalid data', async () => {
  render(PostForm);
  await userEvent.type(await screen.findByLabel('Title'), '');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText('Please enter a valid title')).toBeInTheDocument();
});
```

The Application Test can fail because of routing, store wiring, a missing prop on a child component, a broken interceptor, or a real bug in the checkout flow. The Component Test can only fail because `PostForm` itself is broken. That breadth is why the book puts the bulk of testing effort at the Application layer. One test there replaces a small pile of Component Tests plus their mocking ceremony.

Practical implications for a Vue project:

- **The whole app boots.** Application Tests navigate to a route instead of importing single components. The router and the store run as part of that route.
- **Mock at the network boundary.** Playwright uses `page.route()`, Vitest uses MSW. Don't reach into Pinia or `vi.mock` internal modules.
- **Tests live in `test/specs/`, not next to a component.** Component Tests sit next to source files; Application Tests describe whole user journeys and live separately.
- **Don't test composables, stores, or plugins in isolation.** The Application Test that uses them covers them.

The book's rule of thumb for placement: if you can phrase a test as a user goal ("should be possible to buy a bike"), it is an Application Test. If it reads only as a component contract ("should emit `submit` when the button is clicked"), it is a Component Test. Otherwise it is a Unit Test on an extracted utility.

## How the book structures a test setup

The recommended file layout:

```
project/
├─ src/
│  └─ components/
│     └─ HelloWorld.spec.ts   ← Component Tests live next to source
├─ test/
│  ├─ utils.ts                ← re-exports + custom setup() helper
│  ├─ driver.ts               ← framework-agnostic Driver interface
│  ├─ drivers/
│  │  ├─ vitest/setup.ts      ← Vitest implementation of the Driver
│  │  └─ playwright/          ← Playwright implementation
│  ├─ dsl/                    ← domain helpers (shop, products, …)
│  └─ specs/                  ← Playwright application tests
├─ vitest.config.ts
└─ playwright.config.ts
```

The Vitest config merges the existing Vite config (so build and test stay in sync) and points at a setup file:

```ts
// vitest.config.ts
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      clearMocks: true,
      environment: 'jsdom',
      setupFiles: ['./test/drivers/vitest/setup.ts'],
      coverage: { provider: 'v8', all: true, reporter: ['html', 'text'] },
    },
  }),
);
```

The custom `test/utils.ts` re-exports everything tests need from a single module. That's the first step toward decoupling from the framework:

```ts
// test/utils.ts
import userEvent from '@testing-library/user-event';
import { render, type RenderOptions } from '@testing-library/vue';

export { screen } from '@testing-library/vue';
export { expect, it } from 'vitest';

export const setup = (component, { renderOptions } = {}) => ({
  user: userEvent.setup(),
  ...render(component, renderOptions),
});
```

A Component Test then looks like this. Nothing imports from `vitest` or `@testing-library`:

```ts
// src/components/HelloWorld.spec.ts
import { expect, it, screen, setup } from '../../test/utils';
import HelloWorld from './HelloWorld.vue';

it('should render the greeting', async () => {
  setup(HelloWorld, { renderOptions: { props: { msg: 'Hello!' } } });
  expect(await screen.findByText('Hello!')).toBeVisible();
});
```

## The three decoupling principles

The book illustrates each principle with a "before" that resembles a typical Vue test, and an "after" that pushes the coupling into one central file.

**1. Decouple from the test framework** via a **driver interface**. The interface defines what tests can do (`click`, `type`, `findByRole`, `goTo`, …) without committing to Playwright or Vitest:

```ts
// test/driver.ts
export type Interactions = {
  click: () => Promise<void>;
  type: (text: string) => Promise<void>;
};

export type Assertions = {
  shouldBeVisible: () => Promise<void>;
};

export type Driver = {
  findByRole: (role: 'button' | 'link', opts: { name: string })
    => Interactions & Assertions;
  findByText: (text: string) => Assertions;
  goTo: (path: string) => Promise<void>;
};
```

Write one driver implementation per framework. The same Application Test then runs under Playwright when you need real-browser confidence, and under Vitest+jsdom when you need sub-second feedback during a refactor.

**2. Decouple from implementation details.** A Component Test that leaks three different couplings in five lines:

```ts
// ❌ couples to Vue Test Utils, axios, AND HTTP
vi.mock('axios');
const wrapper = mount(ProductList);
axios.get.mockResolvedValue({ data: fakeProducts });
expect(axios.get).toHaveBeenCalledWith('/api/products');
expect(wrapper.text()).toContain('Bread');
```

The same test, decoupled, hides the framework behind `test/utils` and the data layer behind a `hasProducts()` helper that owns the mocking strategy:

```ts
// ✅ no direct mention of axios, HTTP, or vue-test-utils
import { render, screen, it, expect } from '../test/utils';
import { hasProducts } from '../test/dsl/products';

it('should render a list of products', async () => {
  await hasProducts(['Bread', 'Butter']);
  await render(ProductList);
  expect(await screen.findByText('Bread')).toBeInDocument();
});
```

Swap REST for GraphQL and only `hasProducts` changes. Swap Vitest for Jest and only `test/utils.ts` changes. The book is firm that CSS selectors and `wrapper.vm` access both count as coupling to internals. Replace them with role-based queries and user-style interactions.

**3. Decouple from the UI** with a small **DSL** that mirrors how a domain expert would describe the feature. A checkout test reads like the original user story:

```ts
it('should show the correct total after adding items', async ({ driver }) => {
  const shop = makeShop({ driver });
  await shop.visit();
  await shop.addItemsToCart();
  await shop.goToCheckout();
  await shop.expectTotalSum(199.99);
});
```

Behind the DSL, `shop.addItemsToCart()` calls the driver's `findByRole('button', { name: 'Add to cart' }).click()`. If the UI later changes from a button to a swipe gesture or a voice command, only the DSL implementation changes. The test itself stays identical. The book notes this is overkill for Component Tests, where simplicity beats abstraction.

## On code coverage

The book reads coverage as a diagnostic. Threshold-driven test writing produces high coverage but ties tests to implementation details, which makes refactoring harder. Low coverage signals untested critical paths. Monitor the trend, investigate uncovered lines case-by-case, and don't gate merges on a percentage. Consistent TDD makes high coverage a by-product.

## Further reading from Markus

The book consolidates ideas Markus Oberlehner has been sharpening on his blog for years. These posts map onto the book's themes:

- [Decoupling Component Tests From Implementation Details with Preconditions](https://markus.oberlehner.net/blog/decoupling-component-tests-from-implementation-details-with-preconditions): the direct precursor to the book's DSL layer. Introduces the `hasProducts()`-style "precondition" helpers that hide MSW setup behind reusable, domain-named functions.
- [Telling a Story with Test Code](https://markus.oberlehner.net/blog/telling-a-story-with-test-code): the mindset behind the DSL chapter. Argues that a test should read as a Given/When/Then user story so non-developers can audit it.
- [Using Mock Service Worker with Vitest and fetch](https://markus.oberlehner.net/blog/using-mock-service-worker-with-vitest-and-fetch): a practical companion to the book's mocking chapter. Walks through the MSW + Vitest setup that makes Application Tests runnable in jsdom.
- [Using Testing Library jest-dom with Vitest](https://markus.oberlehner.net/blog/using-testing-library-jest-dom-with-vitest): the matcher setup the book assumes is already working (`toBeInTheDocument`, `toBeVisible`, etc.).
- [Visual Regression Testing With Vitest](https://markus.oberlehner.net/blog/visual-regression-testing-with-vitest): the current illustration of the Vitest + Playwright pairing, using Vitest's browser mode with the Playwright provider for stable snapshots.
- [Using the Wrapper Factory Pattern for Vue.js Unit Testing](https://markus.oberlehner.net/blog/using-the-wrapper-factory-pattern-for-vue-unit-testing): a 2018 piece that, in hindsight, is the seed of the Driver pattern. Useful for seeing the lineage of "always abstract over the test framework".

Markus also publishes free chapter excerpts and follow-up essays on the [Good Vue Tests Substack](https://goodvuetests.substack.com/).

## Talks and videos

Most of Markus Oberlehner's testing talks live on conference channels rather than a personal channel. The recordings below cover the same arguments as the book. Most include live-coded walkthroughs:

- [Writing Good Tests for Vue Applications (Vue.js Live 2023)](https://www.youtube.com/watch?v=lwDueLed9fE): the conference version of the book itself. A live-coded TDD walkthrough that mixes E2E with component tests and frames good tests as the precondition for confident refactoring and Friday deploys.
- [Perfect Vue Test Environment with Playwright and Vitest](https://www.youtube.com/watch?v=MxH3ApkuNMA): the practical setup that backs the book's driver and DSL chapters. Demonstrates running the same tests under Playwright and Vitest by hiding both behind a domain-specific language.
- [Vitest or Cypress? Why not both?! (vuejs.de Conf 2022)](https://www.youtube.com/watch?v=vY9t6hNFhFc): challenges the "Cypress for E2E, Vitest for units" split and argues for combining the two, the foundation of the book's Application-Tests-in-both-runners stance.
- [Writing (Really) Good Tests (Vuejs Amsterdam 2023)](https://www.youtube.com/watch?v=zPGJ4DL4d6A): walks through E2E, integration, unit, and component tests and which to focus on. Mirrors the book's testing-strategy chapters, with decoupling tests from implementation as the central theme.
- [No More Mocking! Write Better Tests For Your Nuxt Application With Contract Tests (Vue.js Live 2024)](https://www.youtube.com/watch?v=2NZmEhuielg): extends the book's mocking chapter into contract testing for Nuxt apps, using Specmatic and OpenAPI stub servers as an alternative to MSW-style mocking for SSR/BFF setups.
