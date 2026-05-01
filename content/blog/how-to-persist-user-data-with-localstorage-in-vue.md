---
author: Alexander Opalic
pubDatetime: 2024-04-21T15:22:00Z
modDatetime: 2024-04-21T15:22:00Z
title: How to Persist User Data with LocalStorage in Vue
slug: how-to-persist-user-data-with-localstorage-in-vue
draft: false
tags:
  - vue
description: "Learn how to efficiently store and manage user preferences like dark mode in Vue applications using LocalStorage. This guide covers basic operations, addresses common challenges, and provides type-safe solutions for robust development."
---

## Introduction

When developing apps, there's often a need to store data. Consider a simple scenario where your application features a dark mode, and users want to save their preferred setting. Most users might prefer dark mode, but some will want light mode. This raises the question: where should we store this preference? We could use an API with a backend to store the setting. For configurations that affect the client's experience, persisting this data locally makes more sense. LocalStorage offers a straightforward solution. In this blog post, I'll guide you through using LocalStorage in Vue and show you how to handle this data in an elegant and type-safe manner.

## Understanding LocalStorage

LocalStorage is a web storage API that lets JavaScript sites store and access data directly in the browser indefinitely. This data remains saved across browser sessions. LocalStorage is straightforward, using a key-value store model where both the key and the value are strings.

Here's how you can use LocalStorage:

- To **store** data: `localStorage.setItem('myKey', 'myValue')`
- To **retrieve** data: `localStorage.getItem('myKey')`
- To **remove** an item: `localStorage.removeItem('myKey')`
- To **clear** all storage: `localStorage.clear()`

![Diagram that explains LocalStorage](../../assets/images/localstorage-vue/diagram.png)

## Using LocalStorage for Dark Mode Settings

In Vue, you can use LocalStorage to save a user's preference for dark mode in a component.

![Picture that shows a button where user can toggle dark mode](../../assets/images/localstorage-vue/picture-dark-mode.png)

```vue
<template>
  <button class="dark-mode-toggle" @click="toggleDarkMode">
    {{ isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode" }}
    <span class="icon" v-html="isDarkMode ? moonIcon : sunIcon" />
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

const isDarkMode = ref(JSON.parse(localStorage.getItem("darkMode") ?? "false"));

const styleProperties = computed(() => ({
  "--background-color": isDarkMode.value ? "#333" : "#FFF",
  "--text-color": isDarkMode.value ? "#FFF" : "#333",
}));

const sunIcon = `<svg some svg </svg>`;

const moonIcon = `<svg some svg </svg>`;

function applyStyles() {
  for (const [key, value] of Object.entries(styleProperties.value)) {
    document.documentElement.style.setProperty(key, value);
  }
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem("darkMode", JSON.stringify(isDarkMode.value));
  applyStyles();
}

// On component mount, apply the stored or default styles
onMounted(applyStyles);
</script>

<style scoped>
.dark-mode-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  font-size: 16px;
  color: var(--text-color);
  background-color: var(--background-color);
  border: 1px solid var(--text-color);
  border-radius: 5px;
  cursor: pointer;
}

.icon {
  display: inline-block;
  margin-left: 10px;
}

:root {
  --background-color: #fff;
  --text-color: #333;
}

body {
  background-color: var(--background-color);
  color: var(--text-color);
  transition:
    background-color 0.3s,
    color 0.3s;
}
</style>
```

## Addressing Issues with Initial Implementation

The basic approach works well for simple cases, but larger applications face these key challenges:

1. **Type Safety and Key Validation**: Always check and handle data from LocalStorage to prevent errors.
2. **Decoupling from LocalStorage**: Avoid direct LocalStorage interactions in your components. Instead, use a utility service or state management for better code maintenance and testing.
3. **Error Handling**: Manage exceptions like browser restrictions or storage limits properly as LocalStorage operations can fail.
4. **Synchronization Across Components**: Use event-driven communication or shared state to keep all components updated with changes.
5. **Serialization Constraints**: LocalStorage stores data as strings, making serialization and deserialization challenging with complex data types.

## Solutions and Best Practices for LocalStorage

To overcome these challenges, consider these solutions:

- **Type Definitions**: Use TypeScript to enforce type safety and help with autocompletion.

```ts
// types/localStorageTypes.ts
export type UserSettings = { name: string };

export type LocalStorageValues = {
  darkMode: boolean;
  userSettings: UserSettings;
  lastLogin: Date;
};

export type LocalStorageKeys = keyof LocalStorageValues;
```

- **Utility Classes**: Create a utility class to manage all LocalStorage operations.

```ts
// utils/LocalStorageHandler.ts
// import { LocalStorageKeys, LocalStorageValues } from '@/types/localStorageTypes';

export class LocalStorageHandler {
  static getItem<K extends LocalStorageKeys>(
    key: K
  ): LocalStorageValues[K] | null {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as LocalStorageValues[K]) : null;
    } catch (error) {
      console.error(`Error retrieving item from localStorage: ${error}`);
      return null;
    }
  }

  static setItem<K extends LocalStorageKeys>(
    key: K,
    value: LocalStorageValues[K]
  ): void {
    try {
      const item = JSON.stringify(value);
      localStorage.setItem(key, item);
    } catch (error) {
      console.error(`Error setting item in localStorage: ${error}`);
    }
  }

  static removeItem(key: LocalStorageKeys): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }
}
```

- **Composables**: Extract logic into Vue composables for better reusability and maintainability

```ts
// composables/useDarkMode.ts
import { ref, watch } from "vue";
import { LocalStorageHandler } from "./LocalStorageHandler";

export function useDarkMode() {
  const isDarkMode = ref(LocalStorageHandler.getItem("darkMode") ?? false);

  watch(isDarkMode, newValue => {
    LocalStorageHandler.setItem("darkMode", newValue);
  });

  return { isDarkMode };
}
```

![Diagram that shows how component and localStorage work together](../../assets/images/localstorage-vue/diagram-local-storage-and-component.png)

You can check the full refactored example out here

[Play with Vue on Vue Playground](https://play.vuejs.org/#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)

## Conclusion

This post explained the effective use of LocalStorage in Vue to manage user settings such as dark mode. We covered its basic operations, addressed common issues, and provided solutions to ensure robust and efficient application development. With these strategies, developers can create more responsive applications that effectively meet user needs.
