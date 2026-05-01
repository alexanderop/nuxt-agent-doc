---
author: Alexander Opalic
pubDatetime: 2026-04-06T00:00:00Z
title: "How to Catch Hydration Errors in Playwright Tests (Astro, Nuxt, React SSR)"
description: "A Playwright fixture that listens to the browser console for hydration mismatch warnings and fails your E2E tests when server and client HTML disagree."
tags: ["testing", "javascript", "performance"]
draft: false
---

Your E2E tests pass. The page loads, buttons work.

But open the browser console:

```text
Hydration failed because the server rendered HTML didn't match the client.
```

This is a hydration mismatch. The server sent one thing and the client replaced it with something else. The page still works, so you don't notice. Your tests don't check for it, so they pass.

## What are SSR and hydration?

**SSR (server-side rendering)** means the server generates HTML and sends it to the browser before JavaScript loads. Users see content before client code boots, and search engines can index it.

Astro and Nuxt build on this model.

**Hydration** is the next step: client JavaScript takes over the server-rendered HTML, attaching event handlers and state to the existing markup. The contract: the first client render must match what the server sent.

When it does not match, the framework discards the server HTML and re-renders on the client. That re-render is a hydration mismatch.

### Common causes

Anything that produces different HTML on client and server:

- Reading `localStorage` or `window.matchMedia()` during render
- Calling `new Date()` or `Math.random()` during render
- Formatting dates or numbers differently across server and client
- Rendering conditional branches based on browser-only state

Theme toggles and locale formatting cause most of them.

If you use Vue with SSR, the `window is not defined` error comes from the same root cause. VueUse has a pattern for it:

## A real bug I found

I was working on an Astro page and my theme hook was reading browser state during the first render:

```ts
function getInitialTheme(): Theme {
  const stored = localStorage.getItem(SITE.themeStorageKey);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
}
```

The server defaulted to `dark`, but the browser picked `light`. React saw the mismatch, logged a hydration warning, and re-rendered from scratch.

The page still worked, the button still existed. Normal E2E tests passed.

**The fix:** start with a deterministic value, resolve browser state after mount.

```ts
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    document.documentElement.classList.toggle("dark", preferredTheme === "dark");
    setTheme(preferredTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(SITE.themeStorageKey, theme);
  }, [mounted, theme]);

  return { theme, setTheme, toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}
```

## The core idea

**Listen to the browser console during a Playwright test. If a hydration warning appears, fail the test.**

React and Vue log hydration mismatches to the console. You don't check the console during automated tests, so this fixture does.

## The fixture

> 
Fixtures are Playwright's way of setting up and tearing down what each test needs. Built-in fixtures like `page` and `browser` come for free. You create custom ones with `base.extend()`. Each fixture runs when a test requests it and gets cleaned up afterward. The fixture below injects `hydrationErrors` and `runtimeErrors` into every test that asks for them.

I first saw this approach in the [npmx.dev](https://npmx.dev) open source project and adapted it for my Astro site. My version covers React and Vue hydration strings and catches uncaught runtime exceptions:

```ts
import { expect, test as base, type ConsoleMessage } from "@playwright/test";

const HYDRATION_ERROR_PATTERNS = [
  /hydration failed because the server rendered html didn't match the client/i,
  /hydration completed but contains mismatches/i,
  /hydration text content mismatch/i,
  /hydration node mismatch/i,
  /hydration attribute mismatch/i,
];

function isHydrationError(text: string): boolean {
  return HYDRATION_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

function toConsoleText(message: ConsoleMessage): string {
  return message.text().trim();
}

export const test = base.extend<{
  hydrationErrors: string[];
  runtimeErrors: string[];
}>({
  hydrationErrors: async ({ page }, use) => {
    const hydrationErrors: string[] = [];

    const handleConsole = (message: ConsoleMessage) => {
      const text = toConsoleText(message);
      if (isHydrationError(text)) {
        hydrationErrors.push(text);
      }
    };

    page.on("console", handleConsole);
    await use(hydrationErrors);
    page.off("console", handleConsole);
  },

  runtimeErrors: async ({ page }, use) => {
    const runtimeErrors: string[] = [];

    const handleConsole = (message: ConsoleMessage) => {
      const text = toConsoleText(message);
      if (message.type() === "error" && text.length > 0 && !isHydrationError(text)) {
        runtimeErrors.push(text);
      }
    };

    const handlePageError = (error: Error) => {
      runtimeErrors.push(error.message);
    };

    page.on("console", handleConsole);
    page.on("pageerror", handlePageError);
    await use(runtimeErrors);
    page.off("console", handleConsole);
    page.off("pageerror", handlePageError);
  },
});

export { expect };
```

Drop this into `test/e2e/test-utils.ts` and import from there instead of `@playwright/test`.

Related: a full AI-driven QA workflow with Playwright:

## Using it

```ts
import { expect, test } from "./test-utils";

test("home page hydrates cleanly", async ({ page, hydrationErrors, runtimeErrors }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();

  expect(hydrationErrors).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});
```

Start with your homepage. Add one interactive route, then one with a theme toggle or client-only widget. That surfaces most bugs.

## How npmx.dev does it at scale

The [npmx.dev](https://npmx.dev) project tests hydration correctness for every combination of user settings across every page, around 48 checks from a single fixture.

They inject `localStorage` values via Playwright's `page.addInitScript()` before navigation, simulating a returning user with saved preferences. Returning users with non-default settings trigger most hydration mismatches.

```ts
const PAGES = ["/", "/about", "/settings", "/compare", "/search", "/package/nuxt"];

test.describe("color mode: dark", () => {
  for (const page of PAGES) {
    test(`${page}`, async ({ page: pw, goto, hydrationErrors }) => {
      await injectLocalStorage(pw, { "npmx-color-mode": "dark" });
      await goto(page, { waitUntil: "hydration" });

      expect(hydrationErrors).toEqual([]);
    });
  }
});

async function injectLocalStorage(page: Page, entries: Record<string, string>) {
  await page.addInitScript((e: Record<string, string>) => {
    for (const [key, value] of Object.entries(e)) {
      localStorage.setItem(key, value);
    }
  }, entries);
}
```

They repeat this for every setting type, locale, accent color, background theme, package manager, relative dates, each with a non-default value. If any combination causes a hydration mismatch on any page, the test fails.

Their fixture uses Vue-specific error strings (`"Hydration completed but contains mismatches"`) while mine uses React patterns. The approach is the same, only the strings you match against change.

More on how E2E tests relate to unit and integration tests:

If you ship an SSR app and do not check for hydration errors in your browser tests, you have one in production right now.
