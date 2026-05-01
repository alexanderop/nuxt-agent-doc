---
author: Alexander Opalic
pubDatetime: 2023-11-25T15:22:00Z
modDatetime: 2024-11-10T15:22:00Z
title: "How to Test Vue Composables: A Comprehensive Guide with Vitest"
slug: how-to-test-vue-composables
draft: false
tags:
  - vue
  - testing
description: "Learn how to effectively test Vue composables using Vitest. Covers independent and dependent composables, with practical examples and best practices."
---

## Introduction

Hello, everyone; in this blog post, I want to help you better understand how to test a composable in Vue. Nowadays, much of our business logic or UI logic is often encapsulated in composables, so I think it’s important to understand how to test them.

## Definitions

Before discussing the main topic, it’s important to understand some basic concepts regarding testing. This foundational knowledge will help clarify where testing Vue compostables fits into the broader landscape of software testing.

### Composables

**Composables** in Vue are reusable composition functions that encapsulate and manage reactive states and logic. They allow a flexible way to organize and reuse code across components, enhancing modularity and maintainability.

### Testing Pyramid

The **Testing Pyramid** is a conceptual metaphor that illustrates the ideal
balance of different types of testing. It recommends a large base of unit tests,
supplemented by a smaller set of integration tests and capped with an even
smaller set of end-to-end tests. This structure ensures efficient and effective
test coverage.

### Unit Testing and How Testing a Composable Would Be a Unit Test

**Unit testing** refers to the practice of testing individual units of code in isolation. In the context of Vue, testing a composable is a form of unit testing. It involves rigorously verifying the functionality of these isolated, reusable code blocks, ensuring they function correctly without external dependencies.

---

## Testing Composables

Composables in Vue are essentially functions, leveraging Vue's reactivity system. Given this unique nature, we can categorize composables into different types. On one hand, there are `Independent Composables`, which can be tested directly due to their standalone nature. On the other hand, we have `Dependent Composables`, which only function correctly when integrated within a component.In the sections that follow, I'll delve into these distinct types, provide examples for each, and guide you through effective testing strategies for both.

---

### Independent Composables

An Independent Composable exclusively uses Vue's Reactivity APIs. These composables operate independently of Vue component instances, making them straightforward to test.

#### Example & Testing Strategy

Here is an example of an independent composable that calculates the sum of two reactive values:

```ts
import { Ref, computed, ComputedRef } from "vue";

function useSum(a: Ref<number>, b: Ref<number>): ComputedRef<number> {
  return computed(() => a.value + b.value);
}
```

To test this composable, you would directly invoke it and assert its returned state:

Test with Vitest:

```ts
describe("useSum", () => {
  it("correctly computes the sum of two numbers", () => {
    const num1 = ref(2);
    const num2 = ref(3);
    const sum = useSum(num1, num2);

    expect(sum.value).toBe(5);
  });
});
```

This test directly checks the functionality of useSum by passing reactive references and asserting the computed result.

---

### Dependent Composables

`Dependent Composables` are distinguished by their reliance on Vue's component instance. They often leverage features like lifecycle hooks or context for their operation. These composables are an integral part of a component and necessitate a distinct approach for testing, as opposed to Independent Composables.

#### Example & Usage

An exemplary Dependent Composable is `useLocalStorage`. This composable facilitates interaction with the browser's localStorage and harnesses the `onMounted` lifecycle hook for initialization:

```ts
import { ref, computed, onMounted, watch } from "vue";

function useLocalStorage<T>(key: string, initialValue: T) {
  const value = ref<T>(initialValue);

  function loadFromLocalStorage() {
    const storedValue = localStorage.getItem(key);
    if (storedValue !== null) {
      value.value = JSON.parse(storedValue);
    }
  }

  onMounted(loadFromLocalStorage);

  watch(value, newValue => {
    localStorage.setItem(key, JSON.stringify(newValue));
  });

  return { value };
}

export default useLocalStorage;
```

This composable can be utilised within a component, for instance, to create a persistent counter:

![Counter Ui](../../assets/images/how-to-test-vue-composables/counter-ui.png)

```vue
<script setup lang="ts">
// ... script content ...
</script>

<template>
  <div>
    <h1>Counter: {{ count }}</h1>
    <button @click="increment">Increment</button>
  </div>
</template>
```

The primary benefit here is the seamless synchronization of the reactive `count` property with localStorage, ensuring persistence across sessions.

### Testing Strategy

To effectively test `useLocalStorage`, especially considering the `onMounted` lifecycle, we initially face a challenge. Let's start with a basic test setup:

```ts
describe("useLocalStorage", () => {
  it("should load the initialValue", () => {
    const { value } = useLocalStorage("testKey", "initValue");
    expect(value.value).toBe("initValue");
  });

  it("should load from localStorage", async () => {
    localStorage.setItem("testKey", JSON.stringify("fromStorage"));
    const { value } = useLocalStorage("testKey", "initialValue");
    expect(value.value).toBe("fromStorage");
  });
});
```

Here, the first test will pass, asserting that the composable initialises with the given `initialValue`. However, the second test, which expects the composable to load a pre-existing value from localStorage, fails. The challenge arises because the `onMounted` lifecycle hook is not triggered during testing. To address this, we need to refactor our composable or our test setup to simulate the component mounting process.

---

### Enhancing Testing with the `withSetup` Helper Function

To facilitate easier testing of composables that rely on Vue's lifecycle hooks, we've developed a higher-order function named `withSetup`. This utility allows us to create a Vue component context programmatically, focusing primarily on the setup lifecycle function where composables are typically used.

#### Introduction to `withSetup`

`withSetup` is designed to simulate a Vue component's setup function, enabling us to test composables in an environment that closely mimics their real-world use. The function accepts a composable and returns both the composable's result and a Vue app instance. This setup allows for comprehensive testing, including lifecycle and reactivity features.

```ts
import type { App } from "vue";
import { createApp } from "vue";

export function withSetup<T>(composable: () => T): [T, App] {
  let result: T;
  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });
  app.mount(document.createElement("div"));
  return [result, app];
}
```

In this implementation, `withSetup` mounts a minimal Vue app and executes the provided composable function during the setup phase. This approach allows us to capture and return the composable's output alongside the app instance for further testing.

#### Utilizing `withSetup` in Tests

With `withSetup`, we can enhance our testing strategy for composables like `useLocalStorage`, ensuring they behave as expected even when they depend on lifecycle hooks:

```ts
it("should load the value from localStorage if it was set before", async () => {
  localStorage.setItem("testKey", JSON.stringify("valueFromLocalStorage"));
  const [result] = withSetup(() => useLocalStorage("testKey", "testValue"));
  expect(result.value.value).toBe("valueFromLocalStorage");
});
```

This test demonstrates how `withSetup` enables the composable to execute as if it were part of a regular Vue component, ensuring the `onMounted` lifecycle hook is triggered as expected. Additionally, the robust TypeScript support enhances the development experience by providing clear type inference and error checking.

---

### Testing Composables with Inject

Another common scenario is testing composables that rely on Vue's dependency injection system using `inject`. These composables present unique challenges as they expect certain values to be provided by ancestor components. Let's explore how to effectively test such composables.

#### Example Composable with Inject

Here's an example of a composable that uses inject:

```ts
import type { InjectionKey } from "vue";
import { inject } from "vue";

export const MessageKey: InjectionKey<string> = Symbol("message");

export function useMessage() {
  const message = inject(MessageKey);

  if (!message) {
    throw new Error("Message must be provided");
  }

  const getUpperCase = () => message.toUpperCase();
  const getReversed = () => message.split("").reverse().join("");

  return {
    message,
    getUpperCase,
    getReversed,
  };
}
```

#### Creating a Test Helper

To test composables that use inject, we need a helper function that creates a testing environment with the necessary providers. Here's a utility function that makes this possible:

```ts
import type { InjectionKey } from "vue";
import { createApp, defineComponent, h, provide } from "vue";

type InstanceType<V> = V extends { new (...arg: any[]): infer X } ? X : never;
type VM<V> = InstanceType<V> & { unmount: () => void };

interface InjectionConfig {
  key: InjectionKey<any> | string;
  value: any;
}

export function useInjectedSetup<TResult>(
  setup: () => TResult,
  injections: InjectionConfig[] = []
): TResult & { unmount: () => void } {
  let result!: TResult;

  const Comp = defineComponent({
    setup() {
      result = setup();
      return () => h("div");
    },
  });

  const Provider = defineComponent({
    setup() {
      injections.forEach(({ key, value }) => {
        provide(key, value);
      });
      return () => h(Comp);
    },
  });

  const mounted = mount(Provider);

  return {
    ...result,
    unmount: mounted.unmount,
  } as TResult & { unmount: () => void };
}

function mount<V>(Comp: V) {
  const el = document.createElement("div");
  const app = createApp(Comp as any);
  const unmount = () => app.unmount();
  const comp = app.mount(el) as any as VM<V>;
  comp.unmount = unmount;
  return comp;
}
```

#### Writing Tests

With our helper function in place, we can now write comprehensive tests for our inject-dependent composable:

```ts
import { describe, expect, it } from "vitest";
import { useInjectedSetup } from "../helper";
import { MessageKey, useMessage } from "../useMessage";

describe("useMessage", () => {
  it("should handle injected message", () => {
    const wrapper = useInjectedSetup(
      () => useMessage(),
      [{ key: MessageKey, value: "hello world" }]
    );

    expect(wrapper.message).toBe("hello world");
    expect(wrapper.getUpperCase()).toBe("HELLO WORLD");
    expect(wrapper.getReversed()).toBe("dlrow olleh");

    wrapper.unmount();
  });

  it("should throw error when message is not provided", () => {
    expect(() => {
      useInjectedSetup(() => useMessage(), []);
    }).toThrow("Message must be provided");
  });
});
```

The `useInjectedSetup` helper creates a testing environment that:

1. Simulates a component hierarchy
2. Provides the necessary injection values
3. Executes the composable in a proper Vue context
4. Returns the composable's result along with an unmount function

This approach allows us to:

- Test composables that depend on inject
- Verify error handling when required injections are missing
- Test the full functionality of methods that use injected values
- Properly clean up after tests by unmounting the test component

Remember to always unmount the test component after each test to prevent memory leaks and ensure test isolation.

---

## Summary

| Independent Composables 🔓                                     | Dependent Composables 🔗                 |
| -------------------------------------------------------------- | ---------------------------------------- |
| - ✅ can be tested directly                                    | - 🧪 need a component to test            |
| - 🛠️ uses everything beside of lifecycles and provide / inject | - 🔄 uses Lifecycles or Provide / Inject |

In our exploration of testing Vue composables, we uncovered two distinct categories: **Independent Composables** and **Dependent Composables**. Independent Composables stand alone and can be tested akin to regular functions, showcasing straightforward testing procedures. Meanwhile, Dependent Composables, intricately tied to Vue's component system and lifecycle hooks, require a more nuanced approach. For these, we learned the effectiveness of utilizing a helper function, such as `withSetup`, to simulate a component context, enabling comprehensive testing.

I hope this blog post has been insightful and useful in enhancing your understanding of testing Vue composables. I'm also keen to learn about your experiences and methods in testing composables within your projects. Your insights and approaches could provide valuable perspectives and contribute to the broader Vue community's knowledge.
