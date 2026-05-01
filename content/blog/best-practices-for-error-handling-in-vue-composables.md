---
author: Alexander Opalic
pubDatetime: 2023-05-18T15:22:00Z
modDatetime: 2023-05-18T15:22:00Z
title: "Best Practices for Error Handling in Vue Composables"
slug: best-practices-for-error-handling-in-vue-composables
draft: false
tags:
  - vue
description: "Error handling can be complex, but it's crucial for composables to manage errors consistently. This post explores an effective method for implementing error handling in composables."
---

## Introduction

Navigating the complex world of composables presented a significant challenge. Understanding this powerful paradigm required effort when determining the division of responsibilities between a composable and its consuming component. The strategy for error handling emerged as a critical aspect that demanded careful consideration.

In this blog post, we aim to clear the fog surrounding this intricate topic. We'll delve into the concept of **Separation of Concerns**, a fundamental principle in software engineering, and how it provides guidance for proficient error handling within the scope of composables. Let's delve into this critical aspect of Vue composables and demystify it together.

> "Separation of Concerns, even if not perfectly possible, is yet the only available technique for effective ordering of one's thoughts, that I know of." -- Edsger W. Dijkstra

## The `usePokemon` Composable

Our journey begins with the creation of a custom composable, aptly named `usePokemon`. This particular composable acts as a liaison between our application and the Pokémon API. It boasts three core methods — `load`, `loadSpecies`, and `loadEvolution` — each dedicated to retrieving distinct types of data.

A straightforward approach would allow these methods to propagate errors directly. Instead, we take a more robust approach. Each method catches potential exceptions internally and exposes them via a dedicated error object. This strategy enables more sophisticated and context-sensitive error handling within the components that consume this composable.

Without further ado, let's delve into the TypeScript code for our `usePokemon` composable:

## Dissecting the `usePokemon` Composable

Let's break down our `usePokemon` composable step by step, to fully grasp its structure and functionality.

### The `ErrorRecord` Interface and `errorsFactory` Function

```ts
interface ErrorRecord {
  load: Error | null;
  loadSpecies: Error | null;
  loadEvolution: Error | null;
}

const errorsFactory = (): ErrorRecord => ({
  load: null,
  loadSpecies: null,
  loadEvolution: null,
});
```

First, we define a `ErrorRecord` interface that encapsulates potential errors from our three core methods. This interface ensures that each method can store a `Error` object or `null` if no error has occurred.

The `errorsFactory` function creates these ErrorRecord objects. It returns an ErrorRecord with all values set to null, indicating no errors have occurred yet.

### Initialising Refs

```ts
import { ref, Ref } from "vue";

const pokemon: Ref<any | null> = ref(null);
const species: Ref<any | null> = ref(null);
const evolution: Ref<any | null> = ref(null);
const error: Ref<ErrorRecord> = ref(errorsFactory());
```

Next, we create the `Ref` objects that store our data (`pokemon`, `species`, and `evolution`) and our error information (error). We use the errorsFactory function to set up the initial error-free state.

### The `load`, `loadSpecies`, and `loadEvolution` Methods

Each of these methods performs a similar set of operations: it fetches data from a specific endpoint of the Pokémon API, assigns the returned data to the appropriate `Ref` object, and handles any potential errors.

```ts
const load = async (id: number) => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    pokemon.value = await response.json();
    error.value.load = null;
  } catch (err) {
    error.value.load = err as Error;
  }
};
```

For example, in the `load` method, we fetch data from the `pokemon` endpoint using the provided ID. A successful fetch updates `pokemon.value` with the returned data and clears any previous error by setting `error.value.load` to null. When an error occurs during the fetch, we catch it and store it in error.value.load.

The `loadSpecies` and `loadEvolution` methods operate similarly, but they fetch from different endpoints and store their data and errors in different Ref objects.

### The Return Object

The composable returns an object providing access to the Pokémon, species, and evolution data, as well as the three load methods. It exposes the error object as a computed property. This computed property updates whenever any of the methods sets an error, allowing consumers of the composable to react to errors.

```ts
return {
  pokemon,
  species,
  evolution,
  load,
  loadSpecies,
  loadEvolution,
  error: computed(() => error.value),
};
```

### Full Code

```ts
import { ref, Ref, computed } from "vue";

interface ErrorRecord {
  load: Error | null;
  loadSpecies: Error | null;
  loadEvolution: Error | null;
}

const errorsFactory = (): ErrorRecord => ({
  load: null,
  loadSpecies: null,
  loadEvolution: null,
});

export default function usePokemon() {
  const pokemon: Ref<any | null> = ref(null);
  const species: Ref<any | null> = ref(null);
  const evolution: Ref<any | null> = ref(null);
  const error: Ref<ErrorRecord> = ref(errorsFactory());

  const load = async (id: number) => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      pokemon.value = await response.json();
      error.value.load = null;
    } catch (err) {
      error.value.load = err as Error;
    }
  };

  const loadSpecies = async (id: number) => {
    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${id}`
      );
      species.value = await response.json();
      error.value.loadSpecies = null;
    } catch (err) {
      error.value.loadSpecies = err as Error;
    }
  };

  const loadEvolution = async (id: number) => {
    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/evolution-chain/${id}`
      );
      evolution.value = await response.json();
      error.value.loadEvolution = null;
    } catch (err) {
      error.value.loadEvolution = err as Error;
    }
  };

  return {
    pokemon,
    species,
    evolution,
    load,
    loadSpecies,
    loadEvolution,
    error: computed(() => error.value),
  };
}
```

## The Pokémon Component

Next, let's look at a Pokémon component that uses our `usePokemon` composable:

```vue
<template>
  <div>
    <div v-if="pokemon">
      <h2>Pokemon Data:</h2>
      <p>Name: {{ pokemon.name }}</p>
    </div>

    <div v-if="species">
      <h2>Species Data:</h2>
      <p>Name: {{ species.base_happiness }}</p>
    </div>

    <div v-if="evolution">
      <h2>Evolution Data:</h2>
      <p>Name: {{ evolution.evolutionName }}</p>
    </div>

    <div v-if="loadError">
      An error occurred while loading the pokemon: {{ loadError.message }}
    </div>

    <div v-if="loadSpeciesError">
      An error occurred while loading the species:
      {{ loadSpeciesError.message }}
    </div>

    <div v-if="loadEvolutionError">
      An error occurred while loading the evolution:
      {{ loadEvolutionError.message }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import usePokemon from "@/composables/usePokemon";

const { load, loadSpecies, loadEvolution, pokemon, species, evolution, error } =
  usePokemon();

const loadError = computed(() => error.value.load);
const loadSpeciesError = computed(() => error.value.loadSpecies);
const loadEvolutionError = computed(() => error.value.loadEvolution);

const pokemonId = ref(1);
const speciesId = ref(1);
const evolutionId = ref(1);

load(pokemonId.value);
loadSpecies(speciesId.value);
loadEvolution(evolutionId.value);
</script>
```

The above code uses the usePokemon composable to fetch and display Pokémon, species, and evolution data. The component shows errors to users when fetch operations fail.

## Conclusion

Wrapping the `fetch` operations in a try-catch block in the `composable` and surfacing errors through a reactive error object keeps the component clean and focused on its core responsibilities - presenting data and handling user interaction.

This approach promotes `separation of concerns` - the composable manages error handling logic independently, while the component responds to the provided state. The component remains focused on presenting the data effectively.

The error object's reactivity integrates seamlessly with Vue's template system. The system tracks changes automatically, updating relevant template sections when the error state changes.

This pattern offers a robust approach to error handling in composables. By centralizing error-handling logic in the composable, you create components that maintain clarity, readability, and maintainability.
