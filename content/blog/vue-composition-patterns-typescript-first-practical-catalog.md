---
author: Alexander Opalic
title: "Vue 3 Composition Patterns"
slug: vue-composition-patterns-typescript-first-practical-catalog
pubDatetime: 2025-03-03T00:00:00Z
draft: true
tags:
  - vue
  - typescript
  - patterns
  - composition-api
description: "A comprehensive catalog of reusable composition patterns that have emerged in Vue 3 development, presented in a TypeScript-first approach with practical examples."
---

## Table of Contents

## Note

This is not a typical blog post but rather a comprehensive reference guide for useful patterns when creating Vue composables. If you know of a pattern not mentioned here, please contact me—I'd be glad to add it. My goal is to establish a single, definitive resource that catalogs all practical composition patterns for the Vue ecosystem.

## Introduction

This guide presents a collection of reusable patterns for Vue 3's Composition API with TypeScript. Similar to how design patterns enhance software development, these composition patterns establish a shared vocabulary for discussing code organization in Vue 3 applications. All examples utilize the modern `<script setup lang="ts">` syntax to promote clear, type-safe code.

Many of these patterns derive from established functional programming principles. At its core, a Vue composable is simply a function, meaning standard functional programming best practices naturally apply.

Each pattern follows the same format:

- **Purpose**: What problem this pattern solves
- **When to use it**: The right situations to apply this pattern
- **How it works**: Code examples showing implementation
- **Trade-offs**: Benefits and drawbacks to consider

## Acknowledgments

This catalog draws inspiration from multiple sources in the Vue.js ecosystem. Many patterns presented here originated from the excellent [VueUse](https://vueuse.org/) collection of composables and Michael Thiessen's comprehensive work on [Vue.js design patterns](https://michaelnthiessen.com/12-design-patterns-vue). Several of the refactoring approaches and pattern thinking were influenced by Martin Fowler's seminal book "Refactoring: Improving the Design of Existing Code," which provides timeless principles for code organization and improvement. The goal of this article is to compile these valuable patterns into a single, comprehensive reference that can serve as both a learning resource and a practical guide for Vue developers.

## Why Patterns Help Vue Developers

Vue 3's Composition API changes how we organize components. Instead of splitting code by technical categories (data, computed, methods), we now group by features or logical concerns. This flexibility is powerful but requires new organization strategies.

These patterns help answer common questions:

- How should I structure my composables?
- When should I extract functionality?
- How do I balance code reuse and readability?
- What proven solutions exist for common problems?

## Pattern Categories Overview

This catalog organizes patterns into six major categories:

1. **Core State Management Patterns**: Fundamental techniques for managing and sharing state between components without complex state management libraries.

2. **UI Interaction Patterns**: Solutions for handling user interactions, DOM events, and browser APIs in a reactive way.

3. **Code Organization Patterns**: Strategies for structuring your code at different levels of granularity, from in-component functions to shared composables.

4. **Advanced State Control Patterns**: Techniques for more sophisticated state management needs, including performance optimization and complex state transitions.

5. **Reusability Patterns**: Approaches that maximize code reuse and flexibility when creating composables.

6. **Integration Patterns**: Methods for integrating Vue with external libraries, browser APIs, and asynchronous operations.

Each category addresses specific challenges you'll encounter when building Vue applications with the Composition API.

## Core State Management Patterns

### Shared State Container

**Purpose**: Share state across components without complex state libraries

**When to use it**: When multiple components need the same state, but prop drilling gets messy

**How it works**:

```ts
// useStore.ts
import { ref, readonly } from "vue";

interface User {
  id: string;
  name: string;
  email: string;
}

const state = ref({
  user: null,
  isAuthenticated: false,
});

export function useStore() {
  // Methods that change state
  function login(userData) {
    state.value.user = userData;
    state.value.isAuthenticated = true;
  }

  function logout() {
    state.value.user = null;
    state.value.isAuthenticated = false;
  }

  // Return readonly state and methods
  return {
    state: readonly(state),
    login,
    logout,
  };
}
```

**Trade-offs**:

- ✅ Shares state without complex libraries
- ✅ Keeps state changes in one place
- ✅ Creates clear boundaries with readonly state
- ❌ Lacks features of dedicated state libraries
- ❌ Can get unwieldy for complex state
- ❌ Doesn't work on SSR

### Functional Core Imperative Shell Pattern

**Purpose**: Separate business logic(functional core) from reactive code(imperative shell) for better testing

**When to use it**: When you have complex calculations that need testing or might be used outside Vue. Keep in mind you can either put the Pure function into the same file or put it into a utility file.

**How it works**:

```ts
// Pure business logic (no Vue dependencies)
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Thin wrapper that adds reactivity
export function useCart() {
  const items = ref([]);
  const total = computed(() => calculateTotal(items.value));

  function addItem(item) {
    items.value.push(item);
  }

  return { items, total, addItem };
}
```

**Trade-offs**:

- ✅ Makes business logic easy to test
- ✅ Creates clear separation between logic and reactivity
- ✅ Enables reuse in non-Vue contexts
- ❌ Adds an extra layer of abstraction
- ❌ Can feel like overkill for simple cases

### Parameter Object

**Purpose**: Use a single options object instead of many parameters

**When to use it**: When a function has many optional parameters or will grow over time

**How it works**:

```ts
// Before
export function useSearch(
  initialQuery = "",
  debounceTime = 300,
  minLength = 3,
  searchFn = defaultSearch
) {
  // Implementation...
}

// After
export function useSearch(options = {}) {
  const {
    initialQuery = "",
    debounceTime = 300,
    minLength = 3,
    searchFn = defaultSearch,
  } = options;

  // Implementation remains the same...
}
```

**Trade-offs**:

- ✅ Makes interfaces more flexible
- ✅ Provides self-documenting parameter names
- ✅ Lets you add new options without breaking existing code
- ❌ Makes some IDE autocompletion less effective
- ❌ Can hide which parameters are required

### Explicit Error State

**Purpose**: Handle errors as part of state rather than throwing exceptions

**When to use it**: For any composable that might encounter errors, especially with async operations

**How it works**:

```ts
export function useDataFetching(url) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(false);

  async function fetchData() {
    // Reset state
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      data.value = await response.json();
    } catch (err) {
      error.value = err.message || "Failed to fetch data";
      data.value = null;
    } finally {
      loading.value = false;
    }
  }

  return {
    data,
    error,
    loading,
    fetchData,
  };
}

// Usage in component
const { data, error, loading, fetchData } = useDataFetching("/api/products");

// In template
// <div v-if="error">Error: {{ error }}</div>
// <div v-else-if="loading">Loading...</div>
// <div v-else>{{ data }}</div>
```

**Trade-offs**:

- ✅ Makes error handling explicit and reactive
- ✅ Lets components decide how to display errors
- ✅ Creates consistent error handling patterns
- ✅ Errors become a normal part of state, not exceptional cases
- ❌ Requires checking error state instead of using try/catch
- ❌ Must include error handling in every composable

## UI Interaction Patterns

### Reactive Adapter

**Purpose**: Turn non-reactive browser APIs into reactive data sources

**When to use it**: When working with browser events or third-party libraries

**How it works**:

```ts
export function useWindowSize() {
  const width = ref(window.innerWidth);
  const height = ref(window.innerHeight);

  function update() {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
  }

  onMounted(() => {
    window.addEventListener("resize", update);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", update);
  });

  return { width, height };
}
```

**Trade-offs**:

- ✅ Creates a consistent reactive programming model
- ✅ Hides implementation details from components
- ✅ Manages cleanup automatically
- ❌ Can cause performance issues with frequent updates
- ❌ May create duplicate listeners if not careful

### DOM Integration Layer

**Purpose**: Handle direct browser interactions separately from app logic

**When to use it**: When components need to interact with DOM elements directly

**How it works**:

```ts
export function useDrag(targetRef) {
  const position = reactive({ x: 0, y: 0 });
  const isDragging = ref(false);

  function onMouseDown(e) {
    isDragging.value = true;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(e) {
    if (!isDragging.value) return;
    position.x = e.clientX;
    position.y = e.clientY;
  }

  function onMouseUp() {
    isDragging.value = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  onMounted(() => {
    const el = targetRef.value;
    if (el) el.addEventListener("mousedown", onMouseDown);
  });

  onUnmounted(() => {
    const el = targetRef.value;
    if (el) el.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  });

  return { position, isDragging };
}
```

**Trade-offs**:

- ✅ Separates DOM interactions from component logic
- ✅ Handles event listeners and cleanup automatically
- ✅ Makes DOM-dependent code reusable
- ❌ May duplicate functionality from libraries
- ❌ Can be complex to implement across browsers

## Code Organization Patterns

### Composable Extraction

**Purpose**: Group related code together within a component

**When to use it**: As a first step toward refactoring when you spot reusable logic

**How it works**:

```vue
<!-- Before extraction -->
<script setup lang="ts">
import { ref, computed } from "vue";

const count = ref(0);
const doubled = computed(() => count.value * 2);

function increment() {
  count.value++;
}

// Other unrelated component logic...
</script>

<!-- After inline extraction -->
<script setup lang="ts">
import { ref, computed } from "vue";

// Extracted into an inline composable
function useCounter() {
  const count = ref(0);
  const doubled = computed(() => count.value * 2);

  function increment() {
    count.value++;
  }

  return { count, doubled, increment };
}

const { count, doubled, increment } = useCounter();

// Other unrelated component logic...
</script>
```

**Trade-offs**:

- ✅ Low-risk first step toward refactoring
- ✅ Improves readability by grouping related logic
- ✅ Makes eventual extraction to separate files easier
- ❌ Doesn't achieve code reuse across components
- ❌ Can make setup function larger if overused

### Function-Level Decomposition

**Purpose**: Break large components into smaller, focused functions

**When to use it**: When a component handles multiple concerns that could be separated

**How it works**:

```vue
<!-- Before: monolithic component -->
<script setup lang="ts">
import { ref, computed } from "vue";

// User form state
const username = ref("");
const email = ref("");

// Form validation
const usernameError = computed(() => {
  if (username.value.length < 3) return "Username too short";
  return "";
});

const emailError = computed(() => {
  if (!email.value.includes("@")) return "Invalid email";
  return "";
});

// Form submission
const isSubmitting = ref(false);

async function submitForm() {
  isSubmitting.value = true;
  try {
    // API call...
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<!-- After: decomposed into functions -->
<script setup lang="ts">
function useUserForm() {
  const username = ref("");
  const email = ref("");

  return { username, email };
}

function useFormValidation(username, email) {
  const usernameError = computed(() => {
    if (username.value.length < 3) return "Username too short";
    return "";
  });

  const emailError = computed(() => {
    if (!email.value.includes("@")) return "Invalid email";
    return "";
  });

  const isValid = computed(() => !usernameError.value && !emailError.value);

  return { usernameError, emailError, isValid };
}

function useFormSubmission(isValid) {
  const isSubmitting = ref(false);

  async function submitForm() {
    if (!isValid.value) return;

    isSubmitting.value = true;
    try {
      // API call
    } finally {
      isSubmitting.value = false;
    }
  }

  return { isSubmitting, submitForm };
}

// Component using decomposed functions
const { username, email } = useUserForm();
const { isValid, usernameError, emailError } = useFormValidation(
  username,
  email
);
const { isSubmitting, submitForm } = useFormSubmission(isValid);
</script>
```

**Trade-offs**:

- ✅ Creates more manageable, focused functions
- ✅ Improves code organization
- ✅ Makes testing easier
- ❌ May create more complex data flow
- ❌ Can lead to over-decomposition

## Advanced State Control Patterns

### Throttle/Debounce Integration

**Purpose**: Limit how often functions run for better performance

**When to use it**: When handling frequent events like scrolling, resizing, or searching

**How it works**:

```ts
export function useSearch(options = {}) {
  const { debounce = 300, initialValue = "" } = options;

  const query = ref(initialValue);
  const results = ref([]);
  const searching = ref(false);

  // Create debounced search function
  const debouncedSearch = useDebounceFn(search, debounce);

  async function search() {
    if (!query.value) {
      results.value = [];
      return;
    }

    searching.value = true;
    try {
      // In a real app, call API here
      results.value = await fetchSearchResults(query.value);
    } finally {
      searching.value = false;
    }
  }

  // Watch for query changes
  watch(query, () => {
    debouncedSearch();
  });

  return {
    query,
    results,
    searching,
  };
}
```

**Trade-offs**:

- ✅ Improves performance for frequent updates
- ✅ Creates responsive UIs that don't block
- ✅ Reduces unnecessary API calls
- ❌ Adds complexity to simple functions
- ❌ Introduces slight delay in responses

### Pausable Interface

**Purpose**: Provide consistent start/stop controls for ongoing operations

**When to use it**: When your code needs operations that can be paused and resumed

**How it works**:

```ts
export function usePolling(endpoint, options = {}) {
  const { interval = 3000, immediate = true } = options;

  const data = ref(null);
  const error = ref(null);
  const isActive = ref(false);

  let timerId = null;

  async function poll() {
    if (!isActive.value) return;

    try {
      const response = await fetch(endpoint);
      data.value = await response.json();
    } catch (err) {
      error.value = err;
    } finally {
      if (isActive.value) {
        timerId = setTimeout(poll, interval);
      }
    }
  }

  function pause() {
    isActive.value = false;
    clearTimeout(timerId);
    timerId = null;
  }

  function resume() {
    if (isActive.value) return;

    isActive.value = true;
    poll();
  }

  onMounted(() => {
    if (immediate) resume();
  });

  onUnmounted(() => {
    pause();
  });

  return {
    data,
    error,
    isActive,
    pause,
    resume,
  };
}
```

**Trade-offs**:

- ✅ Provides consistent controls for different operations
- ✅ Makes state management explicit
- ✅ Creates clear distinction between stop and pause
- ❌ Not needed for simple operations
- ❌ Requires consistent state tracking

## Reusability Patterns

### Maybe Ref Pattern

**Purpose**: Allow composables to accept both reactive refs and raw values as input

**When to use it**: When creating composables that should work with both reactive and non-reactive inputs

**How it works**:

```ts
import { ref, unref, isRef, watchEffect, computed } from "vue";

// Helper functions to handle maybe-ref values
export function unrefElement(elRef) {
  const rawElement = unref(elRef);
  return rawElement ? (rawElement.$el ?? rawElement) : null;
}

// Simple example with primitive values
export function useDoubleValue(maybeRef) {
  // Create a computed that automatically unwraps the ref if needed
  const doubled = computed(() => {
    const value = unref(maybeRef); // Works with both ref and raw value
    return value * 2;
  });

  return { doubled };
}

// More complex example with API fetching
export function useFetchData(urlOrRef) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(false);

  watchEffect(async () => {
    loading.value = true;
    error.value = null;

    try {
      // unref() safely gets the current value whether it's a ref or not
      const url = unref(urlOrRef);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      data.value = await response.json();
    } catch (err) {
      error.value = err.message || "Failed to fetch data";
    } finally {
      loading.value = false;
    }
  });

  return { data, error, loading };
}

// Usage with both types
// With a raw value:
const { doubled: doubledNumber } = useDoubleValue(10); // Returns 20

// With a ref:
const count = ref(5);
const { doubled } = useDoubleValue(count); // Initially 10, reactive to count changes
count.value = 8; // doubled will update to 16

// With string URL
const { data: staticData } = useFetchData("/api/static-data");

// With reactive URL
const productId = ref("abc123");
const { data: productData } = useFetchData(
  computed(() => `/api/products/${productId.value}`)
);
// When productId changes, the data will be refetched automatically
```

**Trade-offs**:

- ✅ Makes composables more flexible and reusable
- ✅ Simplifies API by allowing both reactive and raw values
- ✅ Works well with Vue's reactivity system
- ✅ Reduces need for wrapper refs in components
- ❌ Slightly more complex implementation
- ❌ Can obscure which inputs are supposed to be reactive
- ❌ Might cause unnecessary reactions if not implemented carefully

### Composable Factory

**Purpose**: Create specialized composables from a base implementation

**When to use it**: When you need variations of a composable with shared core logic

**How it works**:

```ts
export function createStorage(factoryOptions = {}) {
  const { storage = localStorage, prefix = "app:" } = factoryOptions;

  // Return a customized composable
  return function useStorage(key, options = {}) {
    const fullKey = `${prefix}${key}`;
    const { defaultValue = null } = options;

    // Create reactive state
    const storedValue = storage.getItem(fullKey);
    const state = ref(storedValue ? JSON.parse(storedValue) : defaultValue);

    // Save changes to storage
    watch(state, newValue => {
      storage.setItem(fullKey, JSON.stringify(newValue));
    });

    function remove() {
      storage.removeItem(fullKey);
      state.value = defaultValue;
    }

    return {
      state,
      remove,
    };
  };
}

// Create specialized storage composables
const useLocalStorage = createStorage({ prefix: "app:" });
const useSessionStorage = createStorage({
  storage: sessionStorage,
  prefix: "session:",
});
```

**Trade-offs**:

- ✅ Creates specialized composables with shared logic
- ✅ Reduces code duplication
- ✅ Separates global and instance configuration
- ❌ Adds complexity with another layer of abstraction
- ❌ Can make debugging harder

### Control Object

**Purpose**: Group related methods together for a cleaner API

**When to use it**: When a composable has many related control methods

**How it works**:

```ts
export function useTimer(options = {}) {
  const { initialValue = 0, interval = 1000, autoStart = false } = options;

  const count = ref(initialValue);
  const isActive = ref(false);

  let timer = null;

  function increment() {
    count.value += 1;
  }

  // Group related controls
  const controls = {
    start() {
      if (isActive.value) return;

      isActive.value = true;
      timer = setInterval(increment, interval);
    },

    pause() {
      if (!isActive.value) return;

      isActive.value = false;
      clearInterval(timer);
      timer = null;
    },

    reset() {
      count.value = initialValue;
    },

    restart() {
      controls.pause();
      controls.reset();
      controls.start();
    },
  };

  if (autoStart) {
    onMounted(() => controls.start());
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });

  return {
    count,
    isActive,
    ...controls,
  };
}
```

**Trade-offs**:

- ✅ Organizes related methods logically
- ✅ Makes it clear which methods are related
- ✅ Enables selective exposure of functions
- ❌ May cause name conflicts
- ❌ Can be verbose when destructuring

## Integration Patterns

### External System Adapter

**Purpose**: Bridge between external libraries and Vue components

**When to use it**: When integrating third-party libraries with their own lifecycle

**How it works**:

```ts
import chart from "chart";

export function useChart(config = {}) {
  const chartRef = ref(null);
  let chart = null;

  function updateChart(data) {
    if (chart) {
      chart.data = data;
      chart.update();
    }
  }

  onMounted(() => {
    if (!chartRef.value) return;

    const ctx = chartRef.value.getContext("2d");
    if (!ctx) return;

    chart = new Chart(ctx, {
      ...config,
      type: config.type || "line",
    });
  });

  onUnmounted(() => {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  });

  return {
    chartRef,
    updateChart,
  };
}
```

**Trade-offs**:

- ✅ Isolates library code from Vue components
- ✅ Handles library lifecycle automatically
- ✅ Creates a Vue-friendly interface
- ❌ Adds another layer between your code and the library
- ❌ May not expose all library features

### Feature Support Detection

**Purpose**: Handle browser compatibility gracefully

**When to use it**: When using APIs that aren't supported in all browsers

**How it works**:

```ts
export function useShare(data = {}) {
  const isSupported = computed(
    () => typeof navigator !== "undefined" && "share" in navigator
  );

  const lastResult = ref(null);
  const error = ref(null);

  async function share(shareData = data) {
    if (!isSupported.value) {
      error.value = new Error("Web Share API not supported");
      return false;
    }

    try {
      await navigator.share(shareData);
      lastResult.value = "shared";
      return true;
    } catch (err) {
      error.value = err;
      lastResult.value = "error";
      return false;
    }
  }

  return {
    isSupported,
    share,
    error,
    lastResult,
  };
}
```

**Trade-offs**:

- ✅ Handles unsupported browsers gracefully
- ✅ Makes feature detection explicit
- ✅ Avoids runtime errors
- ❌ Adds complexity to implementation
- ❌ May return no-ops in unsupported environments

### Async Composables

**Purpose**: Automatically handle reactive data fetching with dependency tracking

**When to use it**: When you need to fetch data that depends on reactive values that may change over time

**How it works**:

```ts
import { ref, watchEffect, toValue } from "vue";

export function useFetch(url) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(true);

  watchEffect(() => {
    // reset state before fetching
    data.value = null;
    error.value = null;
    loading.value = true;

    // toValue() unwraps potential refs or getters
    fetch(toValue(url))
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(json => {
        data.value = json;
        loading.value = false;
      })
      .catch(err => {
        error.value = err;
        loading.value = false;
      });
  });

  return { data, error, loading };
}

// Usage with reactive dependency
const userId = ref("1");
const { data, error, loading } = useFetch(() => `/api/users/${userId.value}`);

// When userId changes, the fetch automatically reruns
function selectUser(id) {
  userId.value = id;
}
```

**Trade-offs**:

- ✅ Automatically refetches when dependencies change
- ✅ Leverages Vue's dependency tracking system
- ✅ Simplifies working with data that depends on reactive state
- ✅ Reduces imperative code for handling async operations
- ❌ May trigger multiple fetches during initial component setup
- ❌ Less control over when fetches occur
- ❌ More implicit behavior compared to explicit function calls

## When to Use These Patterns

Here are signs that suggest you should apply a specific pattern:

- **Shared State Container**: Multiple components need the same state
- **Pure Logic Separation**: Complex calculations that need testing
- **Function Extraction**: Setup function exceeds 50 lines
- **Parameter Object**: Function has more than 3 parameters
- **Explicit Error State**: Working with async operations or API calls
- **Reactive Adapter**: Working with browser events or third-party code
- **DOM Integration**: Need direct access to DOM elements
- **Throttle/Debounce**: Handling frequent events (scroll, resize, input)
- **Composable Factory**: Need variations of the same composable
- **External System Adapter**: Integrating third-party libraries
- **Async Composables**: Fetching data that depends on reactive state
- **Maybe Ref Pattern**: When creating composables that need to work with both refs and raw values

## Pattern Quick Reference

| Pattern                   | Purpose                                     | When to Use                                                                             |
| ------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| Shared State Container    | Share state across components               | When multiple components need the same state                                            |
| Pure Logic Separation     | Isolate business logic                      | For complex calculations and testing                                                    |
| Parameter Object          | Use options object instead of parameters    | For functions with many options                                                         |
| Explicit Error State      | Handle errors as part of state              | For async operations and API calls                                                      |
| Reactive Adapter          | Make non-reactive APIs reactive             | When working with browser APIs                                                          |
| DOM Integration           | Handle DOM interactions                     | When needing direct element access                                                      |
| Function Extraction       | Group related code                          | First step in refactoring                                                               |
| Function Decomposition    | Break into smaller functions                | When components have multiple concerns                                                  |
| Throttle/Debounce         | Limit function calls                        | For frequent events                                                                     |
| Pausable Interface        | Add start/stop controls                     | For ongoing operations                                                                  |
| Composable Factory        | Create specialized composables              | For variations with shared logic                                                        |
| Control Object            | Group related methods                       | When a composable has many control methods                                              |
| External System Adapter   | Integrate external libraries                | When using third-party code                                                             |
| Feature Support Detection | Handle browser compatibility                | When using modern browser APIs                                                          |
| Async Composables         | Automatically handle reactive data fetching | When fetching data that depends on reactive state                                       |
| Maybe Ref Pattern         | Allow inputs to be refs or raw values       | When creating flexible composables that work with both reactive and non-reactive inputs |

## Conclusion

These Vue 3 Composition patterns give you proven solutions to common challenges. Use them to improve your code's clarity, maintainability, and reusability.

Remember that patterns should simplify your code, not complicate it. Choose patterns that solve real problems in your application, and adapt them to your specific needs.

As your team works with these patterns, you'll likely develop your own variations that fit your project perfectly. The best patterns are the ones that help your team work efficiently and create maintainable code.
