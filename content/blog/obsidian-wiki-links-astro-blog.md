---
author: Alexander Opalic
pubDatetime: 2025-01-10T00:00:00Z
title: "Adding Obsidian-Style Wiki Links to My Astro Blog"
slug: adding-obsidian-wiki-links-to-astro-blog
description: "I added [[wiki link]] syntax to my Astro blog with hover preview cards. Here's how it works and how you can build it too."
tags: ["astro", "markdown", "obsidian"]
draft: false
---

## TLDR

I built a remark plugin that transforms `[[slug]]` syntax into internal links with hover preview cards. It supports multiple content collections, custom display text, and shows broken link warnings at build time.

## Live Examples

Hover over these links to see the preview cards in action:

**Blog post:** [[are-llms-creative]]

**Blog post with alias:** [[are-llms-creative|my thoughts on LLM creativity]]

**TIL:** [[til:dynamic-pinia-stores]]

**Notes:** [[notes:software-testing-with-generative-ai|Testing with AI]]

**Broken link:** [[this-post-does-not-exist]]

All of these are written as simple `[[slug]]` syntax in the markdown source.

## Why I Built This

I use Obsidian for note-taking and love the `[[wiki link]]` syntax. It's fast to type and creates connections between notes naturally. I wanted the same experience when writing blog posts.

Before this, I had an `InternalLink` component that required MDX imports:

```mdx
import InternalLink from "@features/mdx-components/components/InternalLink.astro";

Check out <InternalLink slug="some-post">this post</InternalLink>.
```

Too verbose. I wanted to just type `[[some-post]]` and have it work.

## How It Works

The solution uses a custom remark plugin that:

1. Finds `[[...]]` patterns in markdown text
2. Looks up the post metadata from the file system
3. Generates the full preview card HTML at build time

### Supported Syntax

```markdown
[[slug]]                           # Links to blog post
[[slug|custom text]]               # With display text
[[til:slug]]                       # Links to TIL collection
[[notes:slug|my notes]]            # Other collections with alias
```

### The Preview Card

Hover over any wiki link to see a preview card with:

- Post title
- Description (3 lines max)
- Tags (first 3)
- Publication date

The card uses fixed positioning to escape overflow containers and flips below the link when too close to the viewport top.

## Building the Remark Plugin

The plugin runs during markdown processing. It reads all content collection files at initialization and caches the metadata for fast lookups.

```ts
// src/lib/remarkWikiLinks.ts
import { visit } from "unist-util-visit";
import matter from "gray-matter";
import fs from "node:fs";

const WIKI_LINK_REGEX = /\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g;

export function remarkWikiLinks() {
  // Load all posts at plugin init
  const cache = loadAllPosts();

  return (tree) => {
    visit(tree, "text", (node, index, parent) => {
      const matches = [...node.value.matchAll(WIKI_LINK_REGEX)];
      if (matches.length === 0) return;

      // Replace matches with HTML nodes containing preview cards
      // ...
    });
  };
}
```

The key insight: remark plugins can output raw HTML nodes. The plugin generates the complete preview card markup, so no separate rehype processing is needed.

### Parsing the Syntax

The regex captures two groups:

1. The target (either `slug` or `collection:slug`)
2. The optional alias after the pipe

```ts
function parseWikiLink(target: string, alias?: string) {
  let collection = "blog";
  let slug = target;

  if (target.includes(":")) {
    const [col, sl] = target.split(":", 2);
    if (["blog", "til", "notes", "prompts"].includes(col)) {
      collection = col;
      slug = sl;
    }
  }

  return { collection, slug, alias };
}
```

### Loading Post Metadata

The plugin reads frontmatter directly from content files using `gray-matter`:

```ts
function loadCollectionPosts(collection: string) {
  const posts = new Map();
  const dir = `src/content/${collection}`;

  for (const file of fs.readdirSync(dir, { recursive: true })) {
    if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;

    const content = fs.readFileSync(`${dir}/${file}`, "utf-8");
    const { data } = matter(content);

    if (data.draft) continue;

    const slug = file.replace(/\.(md|mdx)$/, "");
    posts.set(slug, {
      title: data.title,
      description: data.description,
      tags: data.tags,
      pubDatetime: data.pubDatetime,
    });
  }

  return posts;
}
```

### Generating Preview Card HTML

The plugin outputs the same HTML structure as my existing `InternalLink` component:

```ts
function createPreviewCardHtml(post, href, displayText) {
  return `
    <span class="internal-link-wrapper">
      <a href="${href}" class="internal-link">${displayText}</a>
      <span class="preview-card" role="tooltip">
        <span class="preview-content">
          <span class="preview-title">${post.title}</span>
          <span class="preview-description">${post.description}</span>
          <!-- tags and date -->
        </span>
      </span>
    </span>
  `;
}
```

## Broken Link Detection

When a wiki link references a non-existent post, the plugin:

1. Logs a warning during build: `[wiki-links] Post not found: blog:missing-slug`
2. Renders the link with error styling (red wavy underline)

```ts
if (!postData) {
  console.warn(`[wiki-links] Post not found: ${collection}:${slug}`);
  return `<span class="wiki-link-broken" title="Post not found: ${slug}">${displayText}</span>`;
}
```

This catches typos and stale references before they hit production.

## Adding the Plugin to Astro

Register the plugin in `astro.config.ts`:

```ts
import { remarkWikiLinks } from "./src/lib/remarkWikiLinks";

export default defineConfig({
  markdown: {
    remarkPlugins: [
      remarkWikiLinks,
      // other plugins...
    ],
  },
});
```

The plugin runs first so wiki links are processed before other transformations.

## The CSS

The styles match my existing `InternalLink` component:

```css
.internal-link-wrapper {
  position: relative;
  display: inline-block;
}

.internal-link {
  @apply text-skin-accent underline decoration-dashed;
}

.preview-card {
  position: absolute;
  bottom: calc(100% + 8px);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s;
}

.wiki-link-broken {
  @apply text-red-400 underline decoration-wavy;
}
```

## The Hover Script

A small inline script handles the preview card positioning:

```js
document.addEventListener("astro:page-load", () => {
  document.querySelectorAll(".internal-link-wrapper").forEach((wrapper) => {
    wrapper.addEventListener("mouseenter", () => {
      const card = wrapper.querySelector(".preview-card");
      // Calculate position, flip if needed, show card
    });
  });
});
```

The script runs on `astro:page-load` to work with Astro's view transitions.

## Result

Now I can write posts with natural wiki link syntax:

```markdown
I wrote about [[are-llms-creative|LLM creativity]] last month.
See also my [[til:dynamic-pinia-stores|TIL on Pinia stores]].
```

The links render with hover previews, and broken references get caught at build time. Much better than importing components everywhere.

## What's Next

A few improvements I'm considering:

- Fuzzy matching for slug typos
- Backlinks section showing which posts link to the current one
- Support for heading anchors: `[[post#section]]`

