---
title: "Adding a Custom Copy Button to Astro Code Blocks with Shiki"
description: "How I built a lightweight, dependency-free copy button for code snippets using Astro's Shiki transformers"
pubDatetime: 2025-05-24T10:30:00.000Z
draft: true
tags:
  - astro
---

When building this blog, I wanted copy buttons for code blocks without adding external dependencies. Here's how I built a zero-runtime solution using Astro's built-in Shiki transformer API.

## Quick Overview

[Shiki](https://shiki.style/) is Astro's default syntax highlighter that runs at build time. Its transformer API lets you modify the generated HTML, making it perfect for adding copy buttons with no JavaScript overhead.

## Implementation Steps

### 1. Create the Shiki Transformer

Create a custom transformer using the `hastscript` library:

```js
// src/lib/shikiCopyButton.js
import { h } from "hastscript";

export function addCopyButton({ toggle = 2000 } = {}) {
  return {
    name: "copy-button",
    pre(node) {
      const btn = h(
        "button",
        {
          type: "button",
          class: "copy",
          "data-code": this.source,
          onclick: `
            navigator.clipboard.writeText(this.dataset.code);
            this.classList.add('copied');
            setTimeout(() => this.classList.remove('copied'), ${toggle});
          `,
          ariaLabel: "Copy code",
        },
        [
          h("span", { class: "ready" }),
          h("span", { class: "hover" }),
          h("span", { class: "success" }),
        ]
      );

      node.children.push(btn);
    },
  };
}
```

The transformer runs during the HTML generation phase, adding a button element to each `<pre>` block with the source code stored in a `data-code` attribute.

### 2. Configure Astro

Add the transformer to your Astro config:

```js
// astro.config.ts
import { addCopyButton } from "./src/lib/shikiCopyButton.js";

export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: "tokyo-night",
      transformers: [addCopyButton({ toggle: 3000 })],
    },
  },
  // ... rest of config
});
```

### 3. Add Styling

Position the button and handle visual feedback with CSS:

```css
/* src/styles/copy-button.css */
pre:has(code) {
  position: relative;
}

pre button.copy {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  height: 2rem;
  width: 2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

pre button.copy:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.1) translateY(-2px);
}

pre button.copy span {
  width: 1rem;
  height: 1rem;
  background: no-repeat center / contain;
  display: block;
  margin: auto;
}

/* State management */
pre button.copy .ready {
  background-image: url("/icons/copy.svg");
}

pre button.copy .success {
  display: none;
  background-image: url("/icons/copy-success.svg");
}

pre button.copy.copied .ready {
  display: none;
}
pre button.copy.copied .success {
  display: block;
}
```

### 4. Create Icons

Add SVG icons that match your design system:

```svg
<!-- copy.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <path d="..." fill="rgb(234, 237, 243)"/>
</svg>

<!-- copy-success.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <path d="..." fill="rgb(255, 107, 237)"/>
</svg>
```

## Key Features

- ✅ Zero runtime JavaScript - everything is static HTML
- ✅ Works with all code block types (Markdown, MDX, ``)
- ✅ Smooth hover animations and visual feedback
- ✅ Consistent positioning across all code blocks
- ✅ No external dependencies required

This approach leverages Astro's Shiki transformer API to create a lightweight, maintainable solution that integrates perfectly with your existing codebase.

---

_Want to see the full implementation? Check out the [source code](https://github.com/yourusername/yourblog) for this blog._
