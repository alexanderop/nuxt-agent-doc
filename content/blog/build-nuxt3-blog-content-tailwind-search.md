---
author: Alexander Opalic
pubDatetime: 2025-05-24T00:00:00Z
modDatetime: 2025-05-24T00:00:00Z
title: "Build a Nuxt 3 Blog with Nuxt Content v3, Tailwind CSS & Client-Side Search"
slug: build-nuxt3-blog-content-tailwind-search
draft: true
tags:
  - nuxt
  - content
  - tailwindcss
  - search
  - typescript
description: "Learn how to build a modern Nuxt 3 blog with Nuxt Content v3, Tailwind CSS, and client-side search using MiniSearch in under 45 minutes."
---

## Introduction

In this tutorial, you'll build a complete Nuxt 3 blog from scratch. We'll start with the basics and move to advanced search features, all while using modern best practices.

## What You'll Do

In about 45 minutes, you will:

- Set up a Nuxt 3 site using `npm create nuxt@latest`
- Add Tailwind CSS with the official module
- Write Markdown posts in a `content/` folder
- Implement a quick keyword search with `queryCollectionSearchSections()`
- Enhance the search with typo-tolerant fuzzy matching using **MiniSearch**

No backend or CMS needed, and you can deploy it as a static site.

## Prerequisites

Make sure you have these tools installed:

| Tool                        | Version         |
| --------------------------- | --------------- |
| **Node.js**                 | 18 LTS / 20 LTS |
| **npm / pnpm / yarn / bun** | latest          |
| **Git**                     | installed       |

## Step 1: Set Up the Project

Create a new Nuxt 3 project:

```bash
npm create nuxt my-blog
```

we will select this

```bash
❯ Would you like to install any of the official modules?
◼ @nuxt/content – The file-based CMS with support for Markdown, YAML, JSON
◼ @nuxt/eslint – Project-aware, easy-to-use, extensible and future-proof ESLint integration
◻ @nuxt/fonts – Add custom web fonts with performance in mind
◻ @nuxt/icon – Icon module for Nuxt with 200,000+ ready to use icons from Iconify
◻ @nuxt/image – Add images with progressive processing, lazy-loading, resizing and providers support
◻ @nuxt/scripts – Add 3rd-party scripts without sacrificing performance
◻ @nuxt/test-utils – Test utilities for Nuxt
◻ @nuxt/ui – The Intuitive UI Library powered by Reka UI and Tailwind CSS
```

Choose the **"Content"** and **"Tailwind CSS"** modules when prompted. The CLI will install and register them for you.

### Alternative Setup

For a non-interactive setup or CI/CD:

```bash
npx nuxi@latest init my-blog --no-install
cd my-blog
npm install @nuxt/content @nuxtjs/tailwindcss
```

Use this method if you need a non-interactive CI flow.

## Step 2: Add Tailwind CSS

If you didn't add Tailwind CSS during the initial setup, you can add it manually using the Nuxt module system.

### Installation

Install the `@nuxtjs/tailwindcss` dependency:

```bash
npx nuxi@latest module add tailwindcss
```

This command will automatically:

- Install the `@nuxtjs/tailwindcss` package
- Add it to your `modules` section in `nuxt.config.ts`
- Generate necessary Tailwind configuration files

### Manual Configuration

If you need to manually add the module to your configuration:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss"],
});
```

### Tailwind Files

When running your Nuxt project, the module will automatically look for these files:

- `./assets/css/tailwind.css`
- `./tailwind.config.{js,cjs,mjs,ts}`

If these files don't exist, the module will automatically generate a basic configuration for them. You can also create the `tailwind.config.js` file manually:

```bash
npx tailwindcss init
```

If you prefer to create your own CSS file for Tailwind CSS, make sure to include the `@tailwind` directives:

```bash
mkdir -p assets/css
touch assets/css/tailwind.css
```

```css
/* ~/assets/css/tailwind.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Module Configuration

You can customize the module's behavior using the `tailwindcss` property in `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss"],
  tailwindcss: {
    // Configuration options
    // See: https://tailwindcss.nuxtjs.org/getting-started/configuration
  },
});
```

For more advanced configuration options, refer to the [official Nuxt Tailwind CSS documentation](https://tailwindcss.nuxtjs.org/getting-started/installation).

## Step 3: Define the Content Collection

Create `content.config.ts` for better typing and indexing:

```bash
touch content.config.ts
```

```ts
// content.config.ts
import { defineContentConfig, defineCollection } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: "page",
      source: "blog/**/*.md",
    }),
  },
});
```

Nuxt will generate a SQLite snapshot and type-safe composables for the `blog` collection.

## Step 4: Set Up App Structure

Before creating content, let's set up the proper app structure with layouts and navigation.

### Update app.vue

First, update the main `app.vue` file to use `<NuxtPage>` with a layout:

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

**Note**: The `<NuxtLayout>` component without a `name` prop will automatically use the `default.vue` layout that we'll create next.

### Create TheHeader Component

Create the components directory and TheHeader component:

```bash
mkdir -p components
touch components/TheHeader.vue
```

```vue
<!-- components/TheHeader.vue -->
<script setup lang="ts">
const route = useRoute();

const isActive = (path: string) => {
  if (path === "/" && route.path === "/") return true;
  if (path !== "/" && route.path.startsWith(path)) return true;
  return false;
};
</script>

<template>
  <header class="border-b border-gray-200 bg-white shadow-sm">
    <nav class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-8">
          <h1 class="text-xl font-bold text-gray-900">
            <NuxtLink to="/" class="transition-colors hover:text-blue-600">
              My Blog
            </NuxtLink>
          </h1>

          <div class="md:flex hidden space-x-6">
            <NuxtLink
              to="/"
              :class="[
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive('/')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              ]"
            >
              Home
            </NuxtLink>

            <NuxtLink
              to="/blog"
              :class="[
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive('/blog')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              ]"
            >
              Blog
            </NuxtLink>

            <NuxtLink
              to="/search"
              :class="[
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive('/search')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              ]"
            >
              Search
            </NuxtLink>
          </div>
        </div>

        <!-- Mobile menu button -->
        <div class="md:hidden">
          <button
            type="button"
            class="text-gray-500 hover:text-gray-600 focus:text-gray-600 focus:outline-none"
            aria-label="toggle menu"
          >
            <svg class="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path
                d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zM4 13h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zM4 21h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  </header>
</template>
```

### Create a Default Layout

Create the layouts directory and a default layout that uses TheHeader:

```bash
mkdir -p layouts
touch layouts/default.vue
```

```vue
<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <TheHeader />
    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>
```

**Note**: This layout is automatically used by the `<NuxtLayout>` component in `app.vue` since it's named `default.vue`. The `<slot />` is where each page's content will be rendered.

### Create Basic Pages

Now let's create the basic page structure. First, create the home page:

```bash
mkdir -p pages
touch pages/index.vue
```

```vue
<!-- pages/index.vue -->
<template>
  <div class="mx-auto max-w-4xl">
    <h1 class="mb-8 text-4xl font-bold text-gray-900">Welcome to My Blog</h1>
    <div class="prose prose-lg max-w-none">
      <p class="mb-6 text-xl text-gray-600">
        A modern blog built with Nuxt 3, Nuxt Content, and Tailwind CSS.
      </p>
      <div class="md:grid-cols-2 grid gap-6">
        <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 class="mb-3 text-xl font-semibold">📝 Latest Posts</h2>
          <p class="mb-4 text-gray-600">
            Discover our latest articles and insights.
          </p>
          <NuxtLink
            to="/blog"
            class="inline-flex items-center font-medium text-blue-600 hover:text-blue-800"
          >
            View Blog →
          </NuxtLink>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 class="mb-3 text-xl font-semibold">🔍 Search</h2>
          <p class="mb-4 text-gray-600">
            Find specific content with our fuzzy search.
          </p>
          <NuxtLink
            to="/search"
            class="inline-flex items-center font-medium text-blue-600 hover:text-blue-800"
          >
            Search Posts →
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
```

## Step 5: Add Sample Blog Posts

Create the content directory:

```bash
mkdir -p content/blog
```

Create your first blog post:

```bash
touch content/blog/hello-nuxt.md
```

```md
## <!-- content/blog/hello-nuxt.md -->

title: Hello Nuxt Content
description: Why file-based CMS rocks.
tags: [nuxt, content]

---

Welcome to **Nuxt Content v3**!

This is our first blog post using the new Nuxt Content system.
The file-based approach makes content management incredibly simple.

## Features

- **Markdown support** - Write in familiar syntax
- **Vue components** - Embed custom components
- **Type safety** - Full TypeScript integration
- **Static generation** - Deploy anywhere
```

Create more posts to demonstrate the search functionality:

```bash
# Create additional blog posts
touch content/blog/nuxt-vs-next.md
touch content/blog/tailwind-tips.md
touch content/blog/content-management-systems.md
```

## Step 6: Create Basic Page Structure

Let's start by creating simple pages that just display headlines, then we'll add the full functionality.

### Blog List Page (Basic Version)

Create the blog listing page:

```bash
mkdir -p pages/blog
touch pages/blog/index.vue
```

```vue
<!-- pages/blog/index.vue -->
<template>
  <div class="mx-auto max-w-4xl">
    <h1 class="mb-8 text-4xl font-bold text-gray-900">Blog</h1>
    <p class="text-gray-600">Blog posts will be listed here.</p>
  </div>
</template>
```

### Search Page (Basic Version)

Create the search page:

```bash
touch pages/search.vue
```

```vue
<!-- pages/search.vue -->
<template>
  <div class="mx-auto max-w-4xl">
    <h1 class="mb-8 text-4xl font-bold text-gray-900">Search</h1>
    <p class="text-gray-600">Search functionality will be implemented here.</p>
  </div>
</template>
```

### Blog Detail Page (Basic Version)

Create the dynamic blog post page:

```bash
touch pages/blog/[...slug].vue
```

```vue
<!-- pages/blog/[...slug].vue -->
<template>
  <div class="mx-auto max-w-4xl">
    <h1 class="mb-8 text-4xl font-bold text-gray-900">Blog Post</h1>
    <p class="text-gray-600">
      Individual blog post content will be displayed here.
    </p>
  </div>
</template>
```

Now you can test your basic navigation by running `npm run dev` and visiting the different pages.

## Step 7: Build the Core Pages with Content

Now let's add the actual functionality to our pages.

### Blog List Page (Full Version)

Update the blog listing page with content functionality:

```vue
<!-- pages/blog/index.vue -->
<script setup lang="ts">
const { data: posts } = await useAsyncData("posts", () =>
  queryCollection("blog").only(["title", "description", "path"]).all()
);
</script>

<template>
  <section class="mx-auto max-w-4xl">
    <h1 class="mb-8 text-4xl font-bold text-gray-900">Blog</h1>
    <div class="space-y-6">
      <article
        v-for="post in posts"
        :key="post.path"
        class="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
      >
        <NuxtLink :to="post.path" class="block">
          <h2
            class="mb-2 text-2xl font-semibold text-blue-600 hover:text-blue-800"
          >
            {{ post.title }}
          </h2>
          <p class="text-gray-600">{{ post.description }}</p>
        </NuxtLink>
      </article>
    </div>
  </section>
</template>
```

### Blog Detail Page (Full Version)

Update the dynamic blog post page:

```vue
<!-- pages/blog/[...slug].vue -->
<script setup lang="ts">
const { path } = useRoute();
const { data: post } = await useAsyncData(path, () =>
  queryCollection("blog").path(path).first()
);

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found" });
}
</script>

<template>
  <article class="prose prose-lg mx-auto max-w-4xl">
    <header class="mb-8">
      <h1 class="mb-4 text-4xl font-bold">{{ post.title }}</h1>
      <p class="text-xl text-gray-600">{{ post.description }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
        >
          {{ tag }}
        </span>
      </div>
    </header>

    <ContentRenderer :value="post" />
  </article>
</template>
```

## Step 8: Add Keyword Search

Now let's implement the search functionality. Update the search page:

```vue
<!-- pages/search.vue -->
<script setup lang="ts">
const q = ref("");
const { data: sections } = await useAsyncData("sections", () =>
  queryCollectionSearchSections("blog")
);

const results = computed(() =>
  q.value
    ? sections.value?.filter(section =>
        section.content.toLowerCase().includes(q.value.toLowerCase())
      ) || []
    : []
);
</script>

<template>
  <section class="mx-auto max-w-4xl">
    <h1 class="mb-8 text-4xl font-bold text-gray-900">Search</h1>

    <div class="mb-8">
      <input
        v-model="q"
        placeholder="Type to search…"
        class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div v-if="q && results.length === 0" class="text-gray-500">
      No results found for "{{ q }}"
    </div>

    <div v-else-if="results.length > 0" class="space-y-4">
      <p class="text-gray-600">{{ results.length }} result(s) found</p>
      <div class="space-y-4">
        <article
          v-for="result in results"
          :key="result.id"
          class="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <NuxtLink :to="result.path" class="block">
            <h3
              class="mb-2 text-xl font-semibold text-blue-600 hover:text-blue-800"
            >
              {{ result.title }}
            </h3>
            <p class="line-clamp-3 text-gray-600">
              {{ result.content.substring(0, 200) }}...
            </p>
          </NuxtLink>
        </article>
      </div>
    </div>
  </section>
</template>
```

## Step 9: Enhanced Fuzzy Search with MiniSearch

For advanced search, add fuzzy search:

```bash
npm install minisearch
```

Create a composable for MiniSearch:

```bash
mkdir -p composables
touch composables/useMiniSearch.ts
```

```ts
// composables/useMiniSearch.ts
import MiniSearch from "minisearch";

interface SearchDocument {
  id: string;
  title: string;
  content: string;
  path: string;
  tags?: string[];
}

export const useMiniSearch = (docs: SearchDocument[]) => {
  const miniSearch = new MiniSearch({
    fields: ["title", "content", "tags"],
    storeFields: ["title", "path", "tags"],
    searchOptions: {
      fuzzy: 0.2,
      prefix: true,
      boost: { title: 2 },
    },
  });

  miniSearch.addAll(docs);

  return {
    search: (term: string) =>
      miniSearch.search(term, {
        fuzzy: 0.2,
        prefix: true,
        combineWith: "OR",
      }),
    suggest: (term: string) => miniSearch.autoSuggest(term),
  };
};
```

Update the search page to use MiniSearch:

```vue
<!-- pages/search.vue -->
<script setup lang="ts">
const q = ref("");
const { data: sections } = await useAsyncData("sections", () =>
  queryCollectionSearchSections("blog")
);

const searchEngine = computed(() => {
  if (!sections.value) return null;

  const docs = sections.value.map(section => ({
    id: section.id,
    title: section.title,
    content: section.content,
    path: section.path,
    tags: section.tags || [],
  }));

  return useMiniSearch(docs);
});

const results = computed(() => {
  if (!q.value || !searchEngine.value) return [];
  return searchEngine.value.search(q.value);
});

const suggestions = computed(() => {
  if (!q.value || !searchEngine.value) return [];
  return searchEngine.value.suggest(q.value).slice(0, 5);
});
</script>

<template>
  <section class="mx-auto max-w-4xl p-6">
    <h1 class="mb-8 text-4xl font-bold">Search</h1>

    <div class="relative mb-8">
      <input
        v-model="q"
        placeholder="Type to search (supports fuzzy matching)…"
        class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      />

      <!-- Search suggestions -->
      <div
        v-if="suggestions.length > 0 && q"
        class="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-gray-300 bg-white shadow-lg"
      >
        <div
          v-for="suggestion in suggestions"
          :key="suggestion.suggestion"
          class="cursor-pointer px-4 py-2 hover:bg-gray-100"
          @click="q = suggestion.suggestion"
        >
          {{ suggestion.suggestion }}
        </div>
      </div>
    </div>

    <div v-if="q && results.length === 0" class="text-gray-500">
      No results found for "{{ q }}"
    </div>

    <div v-else-if="results.length > 0" class="space-y-4">
      <p class="text-gray-600">{{ results.length }} result(s) found</p>
      <div class="space-y-4">
        <article
          v-for="result in results"
          :key="result.id"
          class="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
        >
          <NuxtLink :to="result.path" class="block">
            <div class="mb-2 flex items-start justify-between">
              <h3
                class="text-xl font-semibold text-blue-600 hover:text-blue-800"
              >
                {{ result.title }}
              </h3>
              <span class="rounded bg-gray-100 px-2 py-1 text-sm text-gray-500">
                Score: {{ result.score.toFixed(2) }}
              </span>
            </div>
            <div class="mb-2 flex flex-wrap gap-1">
              <span
                v-for="tag in result.tags"
                :key="tag"
                class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
              >
                {{ tag }}
              </span>
            </div>
          </NuxtLink>
        </article>
      </div>
    </div>
  </section>
</template>
```

## Step 10: Run and Deploy

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000/blog` to see your blog posts and `/search` to test the search functionality.

### Static Site Generation

For deployment to static hosting:

```bash
npm run generate
```

For GitHub Pages, add this to your `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss", "@nuxt/content"],
  nitro: {
    preset: "github-pages",
  },
});
```

## Best Practices

- **Content Organization**: Keep your content files organized with clear filenames
- **SEO Optimization**: Use proper meta tags and structured content
- **Performance**: Use Nuxt's static generation for fast loading
- **Search UX**: Implement debouncing for search queries to improve performance
- **Accessibility**: Ensure your search interface is keyboard-friendly

## Next Steps

Enhance your blog with:

- **Table of Contents**: Enable with `content.markdown.toc = { depth: 3 }`
- **Alternative Search**: Try Fuse.js or FlexSearch for different ranking algorithms
- **Live Demos**: Use [nuxt.new](https://nuxt.new) in StackBlitz for testing
- **UI Components**: Explore Nuxt UI for pre-styled components
- **RSS Feed**: Add RSS feed generation for better discoverability
- **Comments**: Integrate with services like Disqus or create your own

## Conclusion

You now have a fully functional Nuxt 3 blog with:

- **Modern Setup**: Built with the latest Nuxt 3 and official modules
- **Elegant Styling**: Tailwind CSS for responsive design
- **Content Management**: File-based CMS with Nuxt Content v3
- **Advanced Search**: Both literal and fuzzy search capabilities
- **Static Deployment**: Ready for any CDN or static hosting

Nuxt 3, Nuxt Content, and Tailwind CSS provide a strong foundation for building modern, fast blogs. The client-side search ensures visitors can easily find content, even with typos or partial matches.

Happy blogging with Nuxt 3!
