---
author: Alexander Opalic
pubDatetime: 2025-05-05T00:00:00Z
title: "From Manual to Magic: Automating Blog Post Series in Astro"
slug: automating-blog-series-astro
draft: true
tags:
  - astro
description: "Learn how we created a reusable Astro component to display blog post series and then automated its implementation using frontmatter and layout logic, making series management a breeze."
---

Managing a series of blog posts can become cumbersome. Manually linking related posts and ensuring the list is updated everywhere is repetitive and error-prone. Wouldn't it be great if our Astro blog could handle this automatically?

In this post, we'll walk through how we built a `BlogSeries` component and evolved its implementation from a manual approach to a fully automated system powered by Astro's content collections and layouts.

## Part 1: Building the `BlogSeries` Component

First, we needed a reusable component to display the series information consistently. We created `src/components/BlogSeries.astro` with the following goals:

1.  **Accept Props:** Take a list of `posts` (with title, slug, description), the `activeSlug` (current post), and an optional `seriesTitle`.
2.  **Display List:** Render a numbered list of posts in the series.
3.  **Highlight Active:** Clearly indicate the current post being viewed.
4.  **Limit Display (for long series):** Only show a window of ~4 posts (current, previous, next) with ellipsis (...) if the series is longer.
5.  **Theming:** Use existing CSS custom properties and Tailwind classes for styling to match the site's theme.

Here's a simplified look at the component structure:

```astro
---
// src/components/BlogSeries.astro
export interface Post {
  /* ... */
}
const { posts, activeSlug, seriesTitle } = Astro.props;

// Logic to determine visible posts & ellipsis based on posts.length and activeSlug
const activeIdx = posts.findIndex(p => p.slug === activeSlug);
let visiblePosts = posts; // Simplified - actual code slices based on activeIdx
let showEllipsisStart = false;
let showEllipsisEnd = false;
if (posts.length > 4) {
  /* ... logic to slice posts and set ellipsis flags ... */
}
---

<nav class="mb-8">
  {/* Display optional seriesTitle */}
  {seriesTitle && <div class="text-skin-accent ...">{seriesTitle}</div>}
  <h2 class="text-skin-accent ...">This post is part of a series</h2>

  <ol class="space-y-2">
    {/* Render ellipsis if needed */}
    {showEllipsisStart && <li class="...">…</li>}

    {/* Map over VISIBLE posts */}
    {
      visiblePosts.map((post: Post, idx: number) => {
        const realIdx = idx; // Calculate original index
        return (
          <li
            class={`relative ... ${post.slug === activeSlug ? "active-styling" : ""}`}
          >
            {/* Link, title, numbering */}
            <a href={`/posts/${post.slug}/`}>
              <span>{realIdx + 1}.</span> {post.title}
            </a>
            {/* Current label */}
            {post.slug === activeSlug && <span>(current)</span>}
            {/* Optional description */}
            {post.description && <div>{post.description}</div>}
          </li>
        );
      })
    }

    {/* Render ellipsis if needed */}
    {showEllipsisEnd && <li class="...">…</li>}
  </ol>
  {/* Optional divider */}
  <div class="border-b ..."></div>
</nav>
```

_(**Note:** The actual implementation includes detailed styling and the full logic for the 4-item display window.)_

## Part 2: The Manual (Tedious) Approach

Initially, we used this component by manually adding it to the top of each relevant `.mdx` file:

```mdx
---
// src/content/blog/post-part-1.mdx
author: ...
title: "Series Part 1"
slug: "series-part-1"
description: "The first part."
pubDatetime: ...
tags: [...]
---

import BlogSeries from "@features/mdx-components/components/BlogSeries.astro"; // 1. Import

// 2. Define the series data MANUALLY
const seriesPosts = [
{ title: "Series Part 1", slug: "series-part-1", description: "..." },
{ title: "Series Part 2", slug: "series-part-2", description: "..." },
// ... potentially many more
];

// 3. Call the component

<BlogSeries
  seriesTitle="My Awesome Series"
  posts={seriesPosts}
  activeSlug="series-part-1"
/>

## Introduction

... rest of post ...
```

This worked, but imagine a 10-part series! We'd have to copy/paste and update that `seriesPosts` array in **all 10 files**. Adding Part 11 would mean editing 10 files again. This violates the DRY (Don't Repeat Yourself) principle and is prone to errors.

## Part 3: Automation with Frontmatter & Layouts

Astro's content collections and layouts provide a much better way.

**Step 1: Define Series in Frontmatter**

We added two new optional fields to our blog post frontmatter:

- `seriesTag`: A unique string identifying the series (e.g., `"vue-graphql-guide"`).
- `seriesTitle`: A user-friendly title for the series (e.g., `"Vue 3 + GraphQL Series"`).

```yaml
---
// src/content/blog/series-part-1.mdx
author: ...
title: "Series Part 1"
slug: "series-part-1"
description: "The first part."
pubDatetime: 2025-01-01T00:00:00Z # Important for sorting!
seriesTag: "my-awesome-series"   # Unique ID
seriesTitle: "My Awesome Series" # Display Name
tags: [...]
---
```

```yaml
---
// src/content/blog/series-part-2.mdx
author: ...
title: "Series Part 2"
slug: "series-part-2"
description: "The second part."
pubDatetime: 2025-01-08T00:00:00Z # Important for sorting!
seriesTag: "my-awesome-series"   # SAME Unique ID
# seriesTitle is optional here, can be inferred or taken from first post
tags: [...]
---
```

**Step 2: Update Content Schema**

To make Astro aware of these new fields, we updated our collection schema in `src/content/config.ts`:

```typescript
// src/content/config.ts
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      // ... existing fields ...
      description: z.string(),
      canonicalURL: z.string().optional(),
      // Add these optional fields:
      seriesTag: z.string().optional(),
      seriesTitle: z.string().optional(),
    }),
});

export const collections = { blog };
```

**Step 3: Implement Logic in the Layout**

We identified the layout used by our blog posts (`src/layouts/PostDetails.astro`) and added logic to its frontmatter script (`---` block):

```astro
---
// src/layouts/PostDetails.astro
import { CollectionEntry, getCollection } from "astro:content";
import BlogSeries from "@features/mdx-components/components/BlogSeries.astro"; // Import here
// ... other imports ...

const { post } = Astro.props; // Current post data passed by Astro
const { seriesTag, seriesTitle } = post.data; // Get series fields

let formattedSeriesPosts: any[] = [];
let displaySeriesTitle = seriesTitle;
const currentPageSlug = post.slug;

// If the current post has a seriesTag...
if (seriesTag) {
  // 1. Fetch ALL blog posts
  const allPosts = await getCollection("blog");

  // 2. Filter by the SAME seriesTag
  const seriesPosts = allPosts
    .filter(p => p.data.seriesTag === seriesTag)
    // 3. Sort them (requires pubDatetime in frontmatter)
    .sort(
      (a, b) =>
        new Date(a.data.pubDatetime).getTime() -
        new Date(b.data.pubDatetime).getTime()
    );

  // 4. Format data needed by the BlogSeries component
  formattedSeriesPosts = seriesPosts.map(p => ({
    /* title, slug, description */
  }));

  // 5. (Optional) Infer title if not provided
  if (!displaySeriesTitle && seriesPosts.length > 0) {
    displaySeriesTitle = seriesTag
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
---

<Layout {...layoutProps}>
  {/* ... header, back button etc ... */}
  <main>
    <h1>{post.data.title}</h1>
    <Datetime pubDatetime={post.data.pubDatetime} />

    {/* 6. Conditionally RENDER the component in the layout */}
    {
      seriesTag && formattedSeriesPosts.length > 1 && (
        <BlogSeries
          seriesTitle={displaySeriesTitle}
          posts={formattedSeriesPosts}
          activeSlug={currentPageSlug}
        />
      )
    }

    <article>
      <Content />
      {/* The actual MDX content */}
    </article>
    {/* ... footer, related posts etc ... */}
  </main>
</Layout>
```

**Step 4: Clean Up Posts**

Finally, we removed the manual `BlogSeries` import and the component call from all individual `.mdx` files that were part of a series. The layout now handles everything!

## Conclusion

By leveraging Astro's content collections and layout system, we transformed our blog series management from a tedious manual task into an elegant, automated process. Adding or updating a series now only requires setting the correct `seriesTag` in the post's frontmatter. This approach is significantly more maintainable, less error-prone, and keeps our content files clean and focused.

Give it a try in your own Astro projects!

---

P.S. This blog is a heavily customized fork of the excellent [AstroPaper theme](https://github.com/satnaing/astro-paper) by Sat Naing!
