---
author: Alexander Opalic
pubDatetime: 2024-08-04T00:00:00Z
modDatetime: 2024-09-29T00:00:00Z
title: "How to Build Your Own Vue-like Reactivity System from Scratch"
slug: how-to-build-your-own-vue-like-reactivity-system-from-scratch
draft: false
tags:
  - vue
description: "Learn to build a Vue-like reactivity system from scratch, implementing your own ref() and watchEffect(). "
---

## Introduction

Understanding the core of modern Frontend frameworks is crucial for every web developer. Vue, known for its reactivity system, offers a seamless way to update the DOM based on state changes. But have you ever wondered how it works under the hood?

In this tutorial, we'll demystify Vue's reactivity by building our own versions of `ref()` and `watchEffect()`. By the end, you'll have a deeper understanding of reactive programming in frontend development.

## What is Reactivity in Frontend Development?

Before we dive in, let's define reactivity:

> **Reactivity: A declarative programming model for updating based on state changes.**[^1]

[^1]: [What is Reactivity](https://www.pzuraq.com/blog/what-is-reactivity) by Pzuraq

This concept is at the heart of modern frameworks like Vue, React, and Angular. Let's see how it works in a simple Vue component:

```vue
<script setup>
import { ref } from "vue";

const counter = ref(0);

const incrementCounter = () => {
  counter.value++;
};
</script>

<template>
  <div>
    <h1>Counter: {{ counter }}</h1>
    <button @click="incrementCounter">Increment</button>
  </div>
</template>
```

In this example:

1. **State Management:** `ref` creates a reactive reference for the counter.
2. **Declarative Programming:** The template uses `{{ counter }}` to display the counter value. The DOM updates automatically when the state changes.

## Building Our Own Vue-like Reactivity System

To create a basic reactivity system, we need three key components:

1. A method to store data
2. A way to track changes
3. A mechanism to update dependencies when data changes

### Key Components of Our Reactivity System

1. A store for our data and effects
2. A dependency tracking system
3. An effect runner that activates when data changes

### Understanding Effects in Reactive Programming

An `effect` is a function that executes when a reactive state changes. Effects can update the DOM, make API calls, or perform calculations.

```ts
type Effect = () => void;
```

This `Effect` type represents a function that runs when a reactive state changes.

### The Store

We'll use a Map to store our reactive dependencies:

```ts
const depMap: Map<object, Map<string | symbol, Set<Effect>>> = new Map();
```

## Implementing Key Reactivity Functions

### The Track Function: Capturing Dependencies

This function records which effects depend on specific properties of reactive objects. It builds a dependency map to keep track of these relationships.

```ts
type Effect = () => void;

let activeEffect: Effect | null = null;

const depMap: Map<object, Map<string | symbol, Set<Effect>>> = new Map();

function track(target: object, key: string | symbol): void {
  if (!activeEffect) return;

  let dependenciesForTarget = depMap.get(target);
  if (!dependenciesForTarget) {
    dependenciesForTarget = new Map<string | symbol, Set<Effect>>();
    depMap.set(target, dependenciesForTarget);
  }

  let dependenciesForKey = dependenciesForTarget.get(key);
  if (!dependenciesForKey) {
    dependenciesForKey = new Set<Effect>();
    dependenciesForTarget.set(key, dependenciesForKey);
  }

  dependenciesForKey.add(activeEffect);
}
```

### The Trigger Function: Activating Effects

When a reactive property changes, this function activates all the effects that depend on that property. It uses the dependency map created by the track function.

```ts
function trigger(target: object, key: string | symbol): void {
  const depsForTarget = depMap.get(target);
  if (depsForTarget) {
    const depsForKey = depsForTarget.get(key);
    if (depsForKey) {
      depsForKey.forEach(effect => effect());
    }
  }
}
```

### Implementing ref: Creating Reactive References

This creates a reactive reference to a value. It wraps the value in an object with getter and setter methods that track access and trigger updates when the value changes.

```ts
class RefImpl<T> {
  private _value: T;

  constructor(value: T) {
    this._value = value;
  }

  get value(): T {
    track(this, "value");
    return this._value;
  }

  set value(newValue: T) {
    if (newValue !== this._value) {
      this._value = newValue;
      trigger(this, "value");
    }
  }
}

function ref<T>(initialValue: T): RefImpl<T> {
  return new RefImpl(initialValue);
}
```

### Creating watchEffect: Reactive Computations

This function creates a reactive computation. It executes the provided effect function and re-runs it whenever any reactive values used within the effect change.

```ts
function watchEffect(effect: Effect): void {
  function wrappedEffect() {
    activeEffect = wrappedEffect;
    effect();
    activeEffect = null;
  }

  wrappedEffect();
}
```

## Putting It All Together: A Complete Example

Let's see our reactivity system in action:

```ts
const countRef = ref(0);
const doubleCountRef = ref(0);

watchEffect(() => {
  console.log(`Ref count is: ${countRef.value}`);
});

watchEffect(() => {
  doubleCountRef.value = countRef.value * 2;
  console.log(`Double count is: ${doubleCountRef.value}`);
});

countRef.value = 1;
countRef.value = 2;
countRef.value = 3;

console.log("Final depMap:", depMap);
```

## Diagram for the complete workflow

![diagram for reactive workflow](../../assets/images/refFromScratch.png)

check out the full example -> [click](https://www.typescriptlang.org/play/?#code/C4TwDgpgBAogZnCBjYUC8UAUBKdA+KANwHsBLAEwG4BYAKDoBsJUBDFUwieRFALlgTJUAHygA7AK4MG6cVIY16tAPTKoAYQBOEFsGgsoAWRZgowYlADO57VHIRIY+2KSkIlqHGKaoOpAAsoYgAjACshADo6VSgAFX9oY1MAd1JpKH9iBnIgsKEPYH9dKABbEygAawgQAotLZg9iOF9BFEso2iRiMWs7ByT+JIAeEPCUABojEyHrTVIxAHMoUUsQEuCsyYBlZiHuITxD2TEIZKmwHEU6OAkXYFJus002CsxgFk0F5n5RoUmqkD8WbzJYrNYbBjYfgkChQADedCgUFIzUwbHunH2KFwCNoSKRXR6WQgEQYxAWmAA5LFnkgKiCWjxgLxKZN0RwuK1gNgrnj8UxUPYwJYAGLeWIfL6oDBCpIRKVvSXMHmI-EorAAQiFovFSu58NV+L6wrFmgln2Yx1O5xmwDmi2WVnBmygO2Aey5h0uhvxspMEXqwEVFuAk21pvNUpVfKRAF86D6BcadZoANLVWTh3Uh+XMTAA6NG9WYLUOFPpkA4n1IrNpjMYE5nN0epl4b0x31liN6gN5gFhrveCuF-HxpRG2sViIscjkNHsTFc6OqsdjhO0G53B5iJ6kBZfTTBqU-PITSrVIF2hlg9ZZKFEMg5XEE7qWYmk8lUml7g8MiBcjwvB8d4QxZSYQKlSZKQBMDz0rXkXx6QVBzNPVM36f0FQg5VFCRYta0jZUDQ7Qleknetk27HMFQLXC1VRcjK2Io0axQqcgJgNh-Ewf8mXwZiWMQt8mA-ClKRgAAPZAJHuB1eKEWD5OxOjBKUoMRyNWMNKgMc4zoNdOgYFhLA8AAlf8AEkSjABghliAhnygMA5kIXRoAAfVchgJAgfhYgQqBSLtCQUG8TAvJ8vyqw7QpSHaTyWG86AMAiiA6IMpEpSIRKfJwPyBKRO0Xjefw4qg1LKW00j3zJMSAHFmFkpZUtg2L4tS7TtGACRNB3NqIgSpL0vXJFA2ypLMEbAA1HLfLiaKi1RabZqgDU0AwfrBp8haWM21KrWSGahurQLXxqz9KTdJrxsi1lxFOI7tpU-Er33CBDza8rZsq57dJ0-T103dhHm0OA7LbeZSHuRLHrm2J73MuArJs8GBK6nqd0bKBEeRhhMEh6GGFh6MDKB+5HmSXQAixIM1P4Gn7xhJ9VTJ7coGSZ4wEgcgaZwAqoHZRc+IwDmTG5mnnrU9sjUFzlhbkaRhvHdnOfFrl2wMmJJJYaymCgCRLBYL5eHXILTtuYBEdkUHMAABmXTpX0FYgJGCJh1BdsRLf-a3-zth2ta5KAAEZ+AAGXJAoEhu6AmnNr3EboSngGp9W+bQBzVWqkTaswAADK2ugt5FLH4AASOEi4T-8IlS2M85Jh310DviACZ+DdDxyBdt2IA9i2rfMKBgmgbvXb1wpoH2uOq+9uAk6p-xefTzO+TH3v++ruBa5WjBZ8RnekqgAAqKBW7o7OSVzvOABEe712eS-LuF1-dz258Pnz68b3kYm-N77RLEnoyfIdB94132hgYOihwHb0gWfGB78D7wIAMy8nXKbM6OcLoinmIlY0Aw7p+jANGIAA)

## Beyond the Basics: What's Missing?

While our implementation covers the core concepts, production-ready frameworks like Vue offer more advanced features:

1. Handling of nested objects and arrays
2. Efficient cleanup of outdated effects
3. Performance optimizations for large-scale applications
4. Computed properties and watchers
5. Much more...

## Conclusion: Mastering Frontend Reactivity

By building our own `ref` and `watchEffect` functions, we've gained valuable insights into the reactivity systems powering modern frontend frameworks. We've covered:

- Creating reactive data stores with `ref`
- Tracking changes using the `track` function
- Updating dependencies with the `trigger` function
- Implementing reactive computations via `watchEffect`

This knowledge empowers you to better understand, debug, and optimize reactive systems in your frontend projects.
