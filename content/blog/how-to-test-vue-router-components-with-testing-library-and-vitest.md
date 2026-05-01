---
author: Alexander Opalic
pubDatetime: 2025-02-16T00:00:00Z
title: "How to Test Vue Router Components with Testing Library and Vitest"
slug: how-to-test-vue-router-components-with-testing-library-and-vitest
description: "Learn how to test Vue Router components using Testing Library and Vitest. This guide covers real router integration, mocked router setups, and best practices for testing navigation, route guards, and dynamic components in Vue applications."
tags: ["vue", "testing", "vue-router", "vitest", "testing-library"]
draft: false
---

## TLDR

This guide shows you how to test Vue Router components using real router integration and isolated component testing with mocks. You'll learn to verify router-link interactions, programmatic navigation, and navigation guard handling.

## Introduction

Modern Vue applications need thorough testing to ensure reliable navigation and component performance. We'll cover testing strategies using Testing Library and Vitest to simulate real-world scenarios through router integration and component isolation.

## Vue Router Testing Techniques with Testing Library and Vitest

Let's explore how to write effective tests for Vue Router components using both real router instances and mocks.

## Testing Vue Router Navigation Components

### Navigation Component Example

```vue
<!-- NavigationMenu.vue -->
<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
const goToProfile = () => {
  router.push("/profile");
};
</script>

<template>
  <nav>
    <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
    <router-link to="/settings" class="nav-link">Settings</router-link>
    <button @click="goToProfile">Profile</button>
  </nav>
</template>
```

### Real Router Integration Testing

Test complete routing behavior with a real router instance:

```typescript
import { render, screen } from "@testing-library/vue";
import { describe, it, expect } from "vitest";
import { createRouter, createWebHistory } from "vue-router";
import NavigationMenu from "../NavigationMenu..vue";
import { userEvent } from "@testing-library/user-event";

describe("NavigationMenu", () => {
  it("should navigate using router links", async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: "/dashboard", component: { template: "Dashboard" } },
        { path: "/settings", component: { template: "Settings" } },
        { path: "/profile", component: { template: "Profile" } },
        { path: "/", component: { template: "Home" } },
      ],
    });

    render(NavigationMenu, {
      global: {
        plugins: [router],
      },
    });

    const user = userEvent.setup();
    expect(router.currentRoute.value.path).toBe("/");

    await router.isReady();
    await user.click(screen.getByText("Dashboard"));
    expect(router.currentRoute.value.path).toBe("/dashboard");

    await user.click(screen.getByText("Profile"));
    expect(router.currentRoute.value.path).toBe("/profile");
  });
});
```

### Mocked Router Testing

Test components in isolation with router mocks:

```typescript
import { render, screen } from "@testing-library/vue";
import { useRouter, type Router } from "vue-router";
import { describe, it, expect, vi } from "vitest";
import NavigationMenu from "../NavigationMenu..vue";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: vi.fn(),
}));

describe("NavigationMenu with mocked router", () => {
  it("should handle navigation with mocked router", async () => {
    const mockRouter = {
      push: mockPush,
      currentRoute: { value: { path: "/" } },
    } as unknown as Router;

    vi.mocked(useRouter).mockImplementation(() => mockRouter);

    const user = userEvent.setup();
    render(NavigationMenu);

    await user.click(screen.getByText("Profile"));
    expect(mockPush).toHaveBeenCalledWith("/profile");
  });
});
```

### RouterLink Stub for Isolated Testing

Create a RouterLink stub to test navigation without router-link behavior:

```ts
// test-utils.ts
import { Component, h } from "vue";
import { useRouter } from "vue-router";

export const RouterLinkStub: Component = {
  name: "RouterLinkStub",
  props: {
    to: {
      type: [String, Object],
      required: true,
    },
    tag: {
      type: String,
      default: "a",
    },
    exact: Boolean,
    exactPath: Boolean,
    append: Boolean,
    replace: Boolean,
    activeClass: String,
    exactActiveClass: String,
    exactPathActiveClass: String,
    event: {
      type: [String, Array],
      default: "click",
    },
  },
  setup(props) {
    const router = useRouter();
    const navigate = () => {
      router.push(props.to);
    };
    return { navigate };
  },
  render() {
    return h(
      this.tag,
      {
        onClick: () => this.navigate(),
      },
      this.$slots.default?.()
    );
  },
};
```

Use the RouterLinkStub in tests:

```ts
import { render, screen } from "@testing-library/vue";
import { useRouter, type Router } from "vue-router";
import { describe, it, expect, vi } from "vitest";
import NavigationMenu from "../NavigationMenu..vue";
import userEvent from "@testing-library/user-event";
import { RouterLinkStub } from "./test-utils";

const mockPush = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: vi.fn(),
}));

describe("NavigationMenu with mocked router", () => {
  it("should handle navigation with mocked router", async () => {
    const mockRouter = {
      push: mockPush,
      currentRoute: { value: { path: "/" } },
    } as unknown as Router;

    vi.mocked(useRouter).mockImplementation(() => mockRouter);

    const user = userEvent.setup();
    render(NavigationMenu, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });

    await user.click(screen.getByText("Dashboard"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });
});
```

### Testing Navigation Guards

Test navigation guards by rendering the component within a route context:

```vue
<script setup lang="ts">
import { onBeforeRouteLeave } from "vue-router";

onBeforeRouteLeave(() => {
  return window.confirm("Do you really want to leave this page?");
});
</script>

<template>
  <div>
    <h1>Route Leave Guard Demo</h1>
    <div>
      <nav>
        <router-link to="/">Home</router-link> |
        <router-link to="/about">About</router-link> |
        <router-link to="/guard-demo">Guard Demo</router-link>
      </nav>
    </div>
  </div>
</template>
```

Test the navigation guard:

```ts
import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRouter, createWebHistory } from "vue-router";
import RouteLeaveGuardDemo from "../RouteLeaveGuardDemo.vue";

const routes = [
  { path: "/", component: RouteLeaveGuardDemo },
  { path: "/about", component: { template: "<div>About</div>" } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const App = { template: "<router-view />" };

describe("RouteLeaveGuardDemo", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    window.confirm = vi.fn();
    await router.push("/");
    await router.isReady();
  });

  it("should prompt when guard is triggered and user confirms", async () => {
    // Set window.confirm to simulate a user confirming the prompt
    window.confirm = vi.fn(() => true);

    // Render the component within a router context
    render(App, {
      global: {
        plugins: [router],
      },
    });

    const user = userEvent.setup();

    // Find the 'About' link and simulate a user click
    const aboutLink = screen.getByRole("link", { name: /About/i });
    await user.click(aboutLink);

    // Assert that the confirm dialog was shown with the correct message
    expect(window.confirm).toHaveBeenCalledWith(
      "Do you really want to leave this page?"
    );

    // Verify that the navigation was allowed and the route changed to '/about'
    expect(router.currentRoute.value.path).toBe("/about");
  });
});
```

### Reusable Router Test Helper

Create a helper function to simplify router setup:

```typescript
// test-utils.ts
import { render } from "@testing-library/vue";
import { createRouter, createWebHistory } from "vue-router";
import type { RenderOptions } from "@testing-library/vue";
// path of the definition of your routes
import { routes } from "../../router/index.ts";

interface RenderWithRouterOptions extends Omit<RenderOptions<any>, "global"> {
  initialRoute?: string;
  routerOptions?: {
    routes?: typeof routes;
    history?: ReturnType<typeof createWebHistory>;
  };
}

export function renderWithRouter(
  Component: any,
  options: RenderWithRouterOptions = {}
) {
  const { initialRoute = "/", routerOptions = {}, ...renderOptions } = options;

  const router = createRouter({
    history: createWebHistory(),
    // Use provided routes or import from your router file
    routes: routerOptions.routes || routes,
  });

  router.push(initialRoute);

  return {
    // Return everything from regular render, plus the router instance
    ...render(Component, {
      global: {
        plugins: [router],
      },
      ...renderOptions,
    }),
    router,
  };
}
```

Use the helper in tests:

```typescript
describe("NavigationMenu", () => {
  it("should navigate using router links", async () => {
    const { router } = renderWithRouter(NavigationMenu, {
      initialRoute: "/",
    });

    await router.isReady();
    const user = userEvent.setup();

    await user.click(screen.getByText("Dashboard"));
    expect(router.currentRoute.value.path).toBe("/dashboard");
  });
});
```

### Conclusion: Best Practices for Vue Router Component Testing

When we test components that rely on the router, we need to consider whether we want to test the functionality in the most realistic use case or in isolation. In my humble opinion, the more you mock a test, the worse it will get. My personal advice would be to aim to use the real router instead of mocking it. Sometimes, there are exceptions, so keep that in mind.

Also, you can help yourself by focusing on components that don't rely on router functionality. Reserve router logic for view/page components. While keeping our components simple, we will never have the problem of mocking the router in the first place.
