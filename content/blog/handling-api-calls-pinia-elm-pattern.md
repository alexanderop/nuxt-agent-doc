---
author: Alexander Opalic
pubDatetime: 2025-10-17T00:00:00Z
title: "How to Handle API Calls in Pinia with The Elm Pattern"
slug: handling-api-calls-pinia-elm-pattern
description: "Learn how to handle API calls in Pinia using the Elm pattern for predictable, testable side effects. Includes complete examples with the Pokemon API."
seriesTag: "pinia-elm-pattern"
seriesTitle: "Pinia + Elm Architecture Series"
tags: ["vue"]
draft: false
---

> 
If your goal is to cache backend results or manage server state, Pinia is not the right tool.
Libraries such as [pinia-colada](https://pinia-colada.esm.dev/), [TanStack Vue Query](https://tanstack.com/query/vue), or [RStore](https://rstore.dev/) are designed for this purpose.
They provide built-in caching, background refetching, and synchronization features that make them a better fit for working with APIs.

The approach described in this post is useful when you want to stay within Pinia but still keep your logic functional, predictable, and easy to test.
It is best for local logic, explicit message-driven updates, or cases where you need fine control over how side effects are triggered and handled.

> 
  This post builds on the concepts introduced in{" "}
  [
    How to Write Better Pinia Stores with the Elm Pattern
  ](/blog/tea-architecture-pinia-private-store-pattern)
  . If you're new to The Elm Architecture or want to understand the full pattern
  for structuring Pinia stores, start there first. This post focuses
  specifically on handling side effects like API calls.

## Understanding Pure Functions and Side Effects

Before diving into the pattern, it's important to understand the foundational concepts of functional programming that make this approach powerful.

### What Is a Pure Function?

A pure function is a function that satisfies two key properties:

1. **Deterministic**: Given the same inputs, it always returns the same output.
2. **No side effects**: It does not interact with anything outside its scope.

Here's a simple example:

```ts
// Pure function - always predictable
function add(a: number, b: number): number {
  return a + b;
}

add(2, 3); // Always returns 5
add(2, 3); // Always returns 5
```

This function is pure because:

- It only depends on its inputs (`a` and `b`)
- It always produces the same result for the same inputs
- It doesn't modify any external state
- It doesn't perform any I/O operations

### What Is a Side Effect?

A side effect is any operation that interacts with the outside world or modifies state beyond the function's return value.

Common side effects include:

```ts
// Side effect: Network request
function fetchUser(id: number) {
  return fetch(`/api/users/${id}`); // Network I/O
}

// Side effect: Modifying external state
let count = 0;
function increment() {
  count++; // Mutates external variable
}

// Side effect: Writing to storage
function saveUser(user: User) {
  localStorage.setItem("user", JSON.stringify(user)); // I/O operation
}

// Side effect: Logging
function calculate(x: number) {
  console.log("Calculating..."); // I/O operation
  return x * 2;
}
```

None of these are pure functions because they interact with something beyond their inputs and outputs.

### Why Does This Matter?

Pure functions are easier to:

- **Test**: No need to mock APIs, databases, or global state
- **Reason about**: The function's behavior is completely determined by its inputs
- **Debug**: No hidden dependencies or unexpected state changes
- **Reuse**: Work anywhere without environmental setup

However, real applications need side effects. You can't build useful software without API calls, database writes, or user interactions.

The key insight from functional programming is not to eliminate side effects, but to **separate** them from your business logic.

## Why Side Effects Are a Problem

A pure function only depends on its inputs and always returns the same output.
If you include an API call or any asynchronous operation inside it, the function becomes unpredictable and hard to test.

Example:

```ts
export function update(model, msg) {
  if (msg.type === "FETCH_POKEMON") {
    fetch("https://pokeapi.co/api/v2/pokemon/pikachu");
    return { ...model, isLoading: true };
  }
}
```

This mixes logic with side effects.
The function now depends on the network and the API structure, making it complex to test and reason about.

## The Solution: Separate Logic and Effects

The Elm Architecture provides a simple way to handle side effects correctly.

1. Keep the update function pure.
2. Move side effects into separate functions that receive a dispatch function.
3. Use the store as the bridge between both layers.

This separation keeps your business logic independent of the framework and easier to verify.

### File Organization

Before diving into the code, here's how we organize the files for a Pinia store using the Elm pattern:

```
src/
└── stores/
    └── pokemon/
        ├── pokemonModel.ts    # Types and initial state
        ├── pokemonUpdate.ts   # Pure update function
        ├── pokemonEffects.ts  # Side effects (API calls)
        └── pokemon.ts         # Pinia store (connects everything)
```

Each file has a clear, single responsibility:

- **`pokemonModel.ts`**: Defines the state shape and message types
- **`pokemonUpdate.ts`**: Contains pure logic for state transitions
- **`pokemonEffects.ts`**: Handles side effects like API calls
- **`pokemon.ts`**: The Pinia store that wires everything together

This structure makes it easy to:

- Find and modify specific logic
- Test each piece independently
- Reuse the update logic in different contexts
- Add new effects without touching business logic

## Example: Fetching Data from the Pokémon API

This example demonstrates how to handle an API call using this pattern.

### `pokemonModel.ts`

The model defines the structure of the state and the possible messages that can change it.

```ts
export type PokemonModel = {
  isLoading: boolean;
  pokemon: string | null;
  error: string | null;
};

export const initialModel: PokemonModel = {
  isLoading: false,
  pokemon: null,
  error: null,
};

export type PokemonMsg =
  | { type: "FETCH_REQUEST"; name: string }
  | { type: "FETCH_SUCCESS"; pokemon: string }
  | { type: "FETCH_FAILURE"; error: string };
```

### `pokemonUpdate.ts`

The update function handles all state transitions in a pure way.

```ts
import type { PokemonModel, PokemonMsg } from "./pokemonModel";

export function update(model: PokemonModel, msg: PokemonMsg): PokemonModel {
  switch (msg.type) {
    case "FETCH_REQUEST":
      return { ...model, isLoading: true, error: null };

    case "FETCH_SUCCESS":
      return { ...model, isLoading: false, pokemon: msg.pokemon };

    case "FETCH_FAILURE":
      return { ...model, isLoading: false, error: msg.error };

    default:
      return model;
  }
}
```

This function has no side effects.
It only describes how the state changes in response to a message.

### `pokemonEffects.ts`

This file performs the network request and communicates back through the dispatch function.

```ts
import type { PokemonMsg } from "./pokemonModel";

export async function fetchPokemon(
  name: string,
  dispatch: (m: PokemonMsg) => void
) {
  dispatch({ type: "FETCH_REQUEST", name });

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!res.ok) throw new Error("Not found");
    const data = await res.json();

    dispatch({ type: "FETCH_SUCCESS", pokemon: data.name });
  } catch (e: any) {
    dispatch({ type: "FETCH_FAILURE", error: e.message });
  }
}
```

This function does not depend on Pinia or Vue.
It simply performs the side effect and dispatches messages based on the result.

### `pokemon.ts`

The Pinia store connects the pure logic and the side effect layer.

```ts
import { defineStore } from "pinia";
import { ref, readonly } from "vue";
import {
  initialModel,
  type PokemonModel,
  type PokemonMsg,
} from "./pokemonModel";
import { update } from "./pokemonUpdate";
import { fetchPokemon } from "./pokemonEffects";

export const usePokemonStore = defineStore("pokemon", () => {
  const model = ref<PokemonModel>(initialModel);

  function dispatch(msg: PokemonMsg) {
    model.value = update(model.value, msg);
  }

  async function load(name: string) {
    await fetchPokemon(name, dispatch);
  }

  return {
    state: readonly(model),
    load,
  };
});
```

The store contains no direct logic for handling API responses.
It only coordinates updates and side effects.

### Usage in a Component

```vue
<script setup lang="ts">
import { ref } from "vue";
import { usePokemonStore } from "@/stores/pokemon";

const store = usePokemonStore();
const name = ref("pikachu");

function fetchIt() {
  store.load(name.value);
}
</script>

<template>
  <div>
    <input v-model="name" placeholder="Enter Pokémon name" />
    <button @click="fetchIt">Search</button>

    <p v-if="store.state.isLoading">Loading...</p>
    <p v-else-if="store.state.error">Error: {{ store.state.error }}</p>
    <p v-else-if="store.state.pokemon">Found: {{ store.state.pokemon }}</p>
  </div>
</template>
```

The component only interacts with the public API of the store.
It does not mutate the state directly.

## Why This Approach Works

Separating logic and effects provides several benefits.

- The update function is pure and easy to test.
- The side effect functions are independent and reusable.
- The store focuses only on coordination.
- The overall data flow remains predictable and maintainable.

This method is especially effective in projects where you want full control over how and when side effects are executed.

> 
Because the `update` function is pure and framework-agnostic, you can test it with simple assertions without any mocking:

```ts
import { describe, it, expect } from "vitest";
import { update } from "./pokemonUpdate";

describe("pokemon update", () => {
  it("sets loading state on fetch request", () => {
    const state = { isLoading: false, pokemon: null, error: null };
    const result = update(state, { type: "FETCH_REQUEST", name: "pikachu" });

    expect(result.isLoading).toBe(true);
    expect(result.error).toBeNull();
  });
});
```

No Pinia setup, no component mounting, just pure function testing.

> 
The Elm pattern adds structure and discipline, but it comes with trade-offs:

**Not ideal for simple stores:**
If your store just fetches data and displays it with minimal logic, the traditional Pinia approach is perfectly fine. Creating four separate files for a simple CRUD operation adds unnecessary complexity.

**Requires team buy-in:**
This pattern works best when your entire team embraces functional programming concepts. If your team isn't comfortable with ideas like pure functions, immutability, and message-driven updates, this pattern will feel foreign and may be resisted.

**Where it shines:**

- Complex business logic with multiple state transitions
- Stores that need rock-solid testing
- Applications with sophisticated side effect orchestration (retries, cancellation, queuing)
- Projects where state predictability is critical

**Bottom line:** Start simple. Adopt this pattern when complexity demands it and your team is ready for functional programming principles. Don't use it just because it's clever—use it when it solves real problems.

## Other Side Effects You Can Handle with This Pattern

This pattern is not limited to API requests.
You can manage any kind of asynchronous or external operation the same way.

Examples include:

- Writing to or reading from `localStorage` or `IndexedDB`
- Sending analytics or telemetry events
- Performing authentication or token refresh logic
- Communicating with WebSockets or event streams
- Scheduling background tasks with `setTimeout` or `requestAnimationFrame`
- Reading files or using browser APIs such as the Clipboard or File System

By using the same structure, you can keep these effects organized and testable.
Each effect becomes an independent unit that transforms external data into messages for your update function.

## Summary

If you only need caching or background synchronization, use a specialized library such as [pinia-colada](https://pinia-colada.esm.dev/), [TanStack Vue Query](https://tanstack.com/query/vue), or [RStore](https://rstore.dev/).
If you need to stay within Pinia and still maintain a functional structure, this approach is effective.

1. Define your model and messages.
2. Keep the update function pure.
3. Implement effects as separate functions that take a dispatch function.
4. Connect them inside the store.

This structure keeps your Pinia stores predictable, testable, and easy to extend to any type of side effect.
