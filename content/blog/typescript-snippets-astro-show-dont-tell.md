---
author: Alexander Opalic
pubDatetime: 2024-09-22T00:00:00Z
modDatetime: 2024-09-29T00:00:00Z
title: "TypeScript Snippets in Astro: Show, Don't Tell"
slug: typescript-snippets-astro-show-dont-tell
draft: false
tags:
  - astro
  - typescript
description: "Learn how to add interactive type information and syntax highlighting to TypeScript snippets in your Astro site, enhancing code readability and user experience."
---

## Elevate Your Astro Code Highlights with TypeScript Snippets

Want to take your Astro code highlights to the next level? This guide will show you how to add TypeScript snippets with hover-over type information, making your code examples more interactive and informative.

## Prerequisites for Astro Code Highlights

Start with an Astro project. Follow the [official Astro quickstart guide](https://docs.astro.build/en/getting-started/) to set up your project.

## Configuring Shiki for Enhanced Astro Code Highlights

Astro includes Shiki for syntax highlighting. Here's how to optimize it for TypeScript snippets:

1. Update your `astro.config.mjs`:

```typescript
import { defineConfig } from "astro/config";

export default defineConfig({
  markdown: {
    shikiConfig: {
      themes: { light: "min-light", dark: "tokyo-night" },
      wrap: true,
    },
  },
});
```

2. Add a stylish border to your code blocks:

```css
pre:has(code) {
  @apply border border-skin-line;
}
```

## Adding Type Information to Code Blocks

To add type information to your code blocks, you can use TypeScript's built-in type annotations:

```typescript
// @errors: 2322
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: "John Doe",
  age: "30", // Type error: Type 'string' is not assignable to type 'number'
};

console.log(user.name);
```

You can also show type information inline:

```typescript
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: "John Doe",
  age: 30,
};

// The type of user.name is 'string'
const name = user.name;
```

## Benefits of Enhanced Astro Code Highlights

Your Astro site now includes:

- Advanced syntax highlighting
- Type information in code blocks
- Adaptive light and dark mode code blocks

These features enhance code readability and user experience, making your code examples more valuable to readers.
