---
author: Alexander Opalic
pubDatetime: 2023-09-16T15:22:00Z
modDatetime: 2023-09-16T15:22:00Z
title: "Mastering Vue 3 Composables: A Comprehensive Style Guide"
slug: mastering-vue-3-composables-a-comprehensive-style-guide
draft: false
tags:
  - vue
description: "Did you ever struggle how to write better composables in Vue? In this Blog post I try to give some tips how to do that"
---

## Introduction

The release of Vue 3 brought a transformational change, moving from the Options API to the Composition API. At the heart of this transition lies the concept of "composables" — modular functions that leverage Vue's reactive features. This change enhanced the framework's flexibility and code reusability. The inconsistent implementation of composables across projects often leads to convoluted and hard-to-maintain codebases.

This style guide harmonizes coding practices around composables, focusing on producing clean, maintainable, and testable code. While composables represent a new pattern, they remain functions at their core. The guide bases its recommendations on time-tested principles of good software design.

This guide serves as a comprehensive resource for both newcomers to Vue 3 and experienced developers aiming to standardize their team's coding style.

## Table of Contents

## File Naming

### Rule 1.1: Prefix with `use` and Follow PascalCase

```ts
// Good
useCounter.ts;
useApiRequest.ts;

// Bad
counter.ts;
APIrequest.ts;
```

---

## Composable Naming

### Rule 2.1: Use Descriptive Names

```ts
// Good
export function useUserData() {}

// Bad
export function useData() {}
```

---

## Folder Structure

### Rule 3.1: Place in composables Directory

```plaintext
src/
└── composables/
    ├── useCounter.ts
    └── useUserData.ts
```

---

## Argument Passing

### Rule 4.1: Use Object Arguments for Four or More Parameters

```ts
// Good: For Multiple Parameters
useUserData({ id: 1, fetchOnMount: true, token: "abc", locale: "en" });

// Also Good: For Fewer Parameters
useCounter(1, true, "session");

// Bad
useUserData(1, true, "abc", "en");
```

---

## Error Handling

### Rule 5.1: Expose Error State

```ts
// Good
const error = ref(null);
try {
  // Do something
} catch (err) {
  error.value = err;
}
return { error };

// Bad
try {
  // Do something
} catch (err) {
  console.error("An error occurred:", err);
}
return {};
```

---

## Avoid Mixing UI and Business Logic

### Rule 6.2: Decouple UI from Business Logic in Composables

Composables should focus on managing state and business logic, avoiding UI-specific behavior like toasts or alerts. Keeping UI logic separate from business logic will ensure that your composable is reusable and testable.

```ts
// Good
export function useUserData(userId) {
  const user = ref(null);
  const error = ref(null);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      user.value = response.data;
    } catch (e) {
      error.value = e;
    }
  };

  return { user, error, fetchUser };
}

// In component
setup() {
  const { user, error, fetchUser } = useUserData(userId);

  watch(error, (newValue) => {
    if (newValue) {
      showToast("An error occurred.");  // UI logic in component
    }
  });

  return { user, fetchUser };
}

// Bad
export function useUserData(userId) {
  const user = ref(null);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      user.value = response.data;
    } catch (e) {
      showToast("An error occurred."); // UI logic inside composable
    }
  };

  return { user, fetchUser };
}
```

---

## Anatomy of a Composable

### Rule 7.2: Structure Your Composables Well

A well-structured composable improves understanding, usage, and maintenance. It consists of these components:

- **Primary State**: The main reactive state that the composable manages.
- **State Metadata**: States that hold values like API request status or errors.
- **Methods**: Functions that update the Primary State and State Metadata. These functions can call APIs, manage cookies, or integrate with other composables.

Following this structure makes your composables more intuitive and improves code quality across your project.

```ts
// Good Example: Anatomy of a Composable
// Well-structured according to Anatomy of a Composable
export function useUserData(userId) {
  // Primary State
  const user = ref(null);

  // Supportive State
  const status = ref("idle");
  const error = ref(null);

  // Methods
  const fetchUser = async () => {
    status.value = "loading";
    try {
      const response = await axios.get(`/api/users/${userId}`);
      user.value = response.data;
      status.value = "success";
    } catch (e) {
      status.value = "error";
      error.value = e;
    }
  };

  return { user, status, error, fetchUser };
}

// Bad Example: Anatomy of a Composable
// Lacks well-defined structure and mixes concerns
export function useUserDataAndMore(userId) {
  // Muddled State: Not clear what's Primary or Supportive
  const user = ref(null);
  const count = ref(0);
  const message = ref("Initializing...");

  // Methods: Multiple responsibilities and side-effects
  const fetchUserAndIncrement = async () => {
    message.value = "Fetching user and incrementing count...";
    try {
      const response = await axios.get(`/api/users/${userId}`);
      user.value = response.data;
    } catch (e) {
      message.value = "Failed to fetch user.";
    }
    count.value++; // Incrementing count, unrelated to user fetching
  };

  // More Methods: Different kind of task entirely
  const setMessage = newMessage => {
    message.value = newMessage;
  };

  return { user, count, message, fetchUserAndIncrement, setMessage };
}
```

---

## Functional Core, Imperative Shell

### Rule 8.2: (optional) use functional core imperative shell pattern

Structure your composable such that the core logic is functional and devoid of side effects, while the imperative shell handles the Vue-specific or side-effecting operations. Following this principle makes your composable easier to test, debug, and maintain.

#### Example: Functional Core, Imperative Shell

```ts
// good
// Functional Core
const calculate = (a, b) => a + b;

// Imperative Shell
export function useCalculatorGood() {
  const result = ref(0);

  const add = (a, b) => {
    result.value = calculate(a, b); // Using the functional core
  };

  // Other side-effecting code can go here, e.g., logging, API calls

  return { result, add };
}

// wrong
// Mixing core logic and side effects
export function useCalculatorBad() {
  const result = ref(0);

  const add = (a, b) => {
    // Side-effect within core logic
    console.log("Adding:", a, b);
    result.value = a + b;
  };

  return { result, add };
}
```

---

## Single Responsibility Principle

### Rule 9.1: Use SRP for composables

A composable should follow the Single Responsibility Principle: one reason to change. This means each composable handles one specific task. Following this principle creates composables that are clear, maintainable, and testable.

```ts
// Good
export function useCounter() {
  const count = ref(0);

  const increment = () => {
    count.value++;
  };

  const decrement = () => {
    count.value--;
  };

  return { count, increment, decrement };
}

// Bad

export function useUserAndCounter(userId) {
  const user = ref(null);
  const count = ref(0);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      user.value = response.data;
    } catch (error) {
      console.error("An error occurred while fetching user data:", error);
    }
  };

  const increment = () => {
    count.value++;
  };

  const decrement = () => {
    count.value--;
  };

  return { user, fetchUser, count, increment, decrement };
}
```

---

## File Structure of a Composable

### Rule 10.1: Rule: Consistent Ordering of Composition API Features

Your team should establish and follow a consistent order for Composition API features throughout the codebase.

Here's a recommended order:

1. Initializing: Setup logic
2. Refs: Reactive references
3. Computed: Computed properties
4. Methods: Functions for state manipulation
5. Lifecycle Hooks: onMounted, onUnmounted, etc.
6. Watch

Pick an order that works for your team and apply it consistently across all composables.

```ts
// Example in useCounter.ts
import { ref, computed, onMounted } from "vue";

export default function useCounter() {
  // Initializing
  // Initialize variables, make API calls, or any setup logic
  // For example, using a router
  // ...

  // Refs
  const count = ref(0);

  // Computed
  const isEven = computed(() => count.value % 2 === 0);

  // Methods
  const increment = () => {
    count.value++;
  };

  const decrement = () => {
    count.value--;
  };

  // Lifecycle
  onMounted(() => {
    console.log("Counter is mounted");
  });

  return {
    count,
    isEven,
    increment,
    decrement,
  };
}
```

## Conclusion

These guidelines provide best practices for writing clean, testable, and efficient Vue 3 composables. They combine established software design principles with practical experience, though they aren't exhaustive.

Programming blends art and science. As you develop with Vue, you'll discover patterns that match your needs. Focus on maintaining a consistent, scalable, and maintainable codebase. Adapt these guidelines to fit your project's requirements.

Share your ideas, improvements, and real-world examples in the comments. Your input helps evolve these guidelines into a better resource for the Vue community.
