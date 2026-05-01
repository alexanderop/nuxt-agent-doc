---
author: Alexander Opalic
title: "TIL - Blending Fuzzy and Semantic Search with Reciprocal Rank Fusion"
pubDatetime: 2025-06-03T00:00:00Z
description: "Learn how to merge fuzzy and semantic search results using Reciprocal Rank Fusion (RRF) with TypeScript implementation and interactive Vue demo"
tags:
  - typescript
  - vue
  - search
---

I learned today how to blend fuzzy search and semantic search results using a method called Reciprocal Rank Fusion (RRF). If you ever build a search feature, you might run two separate searches (one that matches text closely and one that matches meaning). RRF helps you merge those two ranked lists into one final list. In this post I explain it in easy words and show how you can do it in TypeScript. At the end I include an interactive Vue component you can paste into your playground.

## Why combine fuzzy and semantic results?

Imagine a user types this query into your search box:

> “vue hooks guide”

A fuzzy search tries to match text exactly (it looks for “vue”, “hooks” and “guide” in titles or content). A semantic search tries to match meaning (it knows that Composition API is similar to hooks in Vue). Let’s say you have these indexed pages:

- **Vue.js Composition API Guide**
- **React Hooks Overview**
- **TypeScript Generics Guide**
- **Vue Router Basics**
- **CSS Flexbox Tutorial**

**Fuzzy hits** might rank (in order):

1. Vue.js Composition API Guide
2. React Hooks Overview
3. Vue Router Basics
4. CSS Flexbox Tutorial

(It matched “vue”, “hooks” or “guide” exactly in those titles. It placed “Vue.js Composition API Guide” first because it contains both “vue” and “guide.”)

**Semantic hits** might rank (in order):

1. Vue.js Composition API Guide
2. Vue Router Basics
3. React Hooks Overview
4. TypeScript Generics Guide

(It matched meaning—Composition API is like hooks—so it ranked that first. It also knows that “Vue Router Basics” belongs to the Vue ecosystem and is related enough.)

If you showed only one list, you would miss out on valuable matches. RRF gives each result a small score based on its position (rank) in each list. Then it adds those scores to get a final ranking.

## How RRF score works

Let’s say you have a ranked list from fuzzy search. The top item is rank 1, next is rank 2, and so on. You also have a ranked list from semantic search with its own ranks. RRF assigns each item a score using this formula:

```
score = weight × (1 / (rank + k))
```

- **rank** is the position in that list (1 means first, 2 means second, and so on)
- **weight** is how much you trust that list (for example 0.5 if you trust fuzzy and 0.5 if you trust semantic)
- **k** (often a number like 60) keeps the scores small so that lower ranked items do not jump too high

Compute that score for every item in each list. If an item appears in both lists (same unique id or slug), add its two scores together. That final sum decides its place in the merged list.

Continuing our example, let’s pick k = 60, fuzzyWeight = 0.5, semanticWeight = 0.5.

> From fuzzy hits:
>
> 1. “Vue.js Composition API Guide” → rank 1 → score = 0.5 × (1 / (1 + 60)) = 0.5 × (1/61) ≈ 0.00820
> 2. “React Hooks Overview” → rank 2 → score = 0.5 × (1 / (2 + 60)) = 0.5 × (1/62) ≈ 0.00806
> 3. “Vue Router Basics” → rank 3 → score = 0.5 × (1 / (3 + 60)) = 0.5 × (1/63) ≈ 0.00794
> 4. “CSS Flexbox Tutorial” → rank 4 → score = 0.5 × (1 / (4 + 60)) = 0.5 × (1/64) ≈ 0.00781

> From semantic hits:
>
> 1. “Vue.js Composition API Guide” → rank 1 → score = 0.5 × (1 / (1 + 60)) ≈ 0.00820
> 2. “Vue Router Basics” → rank 2 → score = 0.5 × (1 / (2 + 60)) ≈ 0.00806
> 3. “React Hooks Overview” → rank 3 → score = 0.5 × (1 / (3 + 60)) ≈ 0.00794
> 4. “TypeScript Generics Guide” → rank 4 → score = 0.5 × (1 / (4 + 60)) ≈ 0.00781

Now add scores for duplicates:

- **Vue.js Composition API Guide**: 0.00820 + 0.00820 = 0.01640
- **React Hooks Overview**: 0.00806 + 0.00794 = 0.01600
- **Vue Router Basics**: 0.00794 + 0.00806 = 0.01600
- **CSS Flexbox Tutorial**: 0.00781 (from fuzzy only)
- **TypeScript Generics Guide**: 0.00781 (from semantic only)

Sorted by total score:

1. Vue.js Composition API Guide (0.01640)
2. React Hooks Overview (0.01600)
3. Vue Router Basics (0.01600)
4. CSS Flexbox Tutorial (0.00781)
5. TypeScript Generics Guide (0.00781)

If two items tie (like “React Hooks Overview” and “Vue Router Basics”), you can break ties by alphabetical order or by whichever list you trust more first.

## Choosing weights by document type

Depending on the kind of content you index, you might want to favor fuzzy or semantic search more. Here are simple guidelines:

(1) API reference or code snippets (high precision needed)

- Use `fuzzyWeight = 0.7` and `semanticWeight = 0.3`
- You want exact matches on function names, class names, or code examples

(2) Tutorials or how to guides (balanced match)

- Use `fuzzyWeight = 0.5` and `semanticWeight = 0.5`
- You want both exact terms and conceptual matches

(3) Blog posts or conceptual articles (meaning matters more)

- Use `fuzzyWeight = 0.3` and `semanticWeight = 0.7`
- You want to catch related ideas even if they do not use exact keywords

Feel free to adjust these values based on your own data. If your content often uses synonyms or varied phrasing you might lean heavier toward semantic weight. If your content is very technical with precise terms you might lean heavier toward fuzzy weight.

## A simple TypeScript example

Below is a snippet that shows how to compute RRF scores and merge two lists. Assume each result has a unique `id` and a `name` (the title or description).

```ts
type SearchResult = { id: string; name: string };

function computeRrfScore(rank: number, weight: number, k: number): number {
  // rank is 1 for first item, 2 for second, and so on
  return weight * (1 / (rank + k));
}

function mergeResults(
  fuzzy: SearchResult[],
  semantic: SearchResult[],
  fuzzyWeight: number,
  semanticWeight: number,
  k: number,
  limit: number
): SearchResult[] {
  // Map from id to { item, score }
  const bucket = new Map<string, { item: SearchResult; score: number }>();

  // Add fuzzy scores
  fuzzy.forEach((item, idx) => {
    const rank = idx + 1;
    const score = computeRrfScore(rank, fuzzyWeight, k);
    const prev = bucket.get(item.id);
    if (prev) {
      prev.score += score;
    } else {
      bucket.set(item.id, { item, score });
    }
  });

  // Add semantic scores
  semantic.forEach((item, idx) => {
    const rank = idx + 1;
    const score = computeRrfScore(rank, semanticWeight, k);
    const prev = bucket.get(item.id);
    if (prev) {
      prev.score += score;
    } else {
      bucket.set(item.id, { item, score });
    }
  });

  // Convert to array and sort by score descending
  const mergedArray = Array.from(bucket.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(entry => entry.item);

  return mergedArray;
}

// Example usage
const fuzzyHits: SearchResult[] = [
  { id: "vue-composition", name: "Vue.js Composition API Guide" },
  { id: "react-hooks", name: "React Hooks Overview" },
  { id: "vue-router", name: "Vue Router Basics" },
  { id: "css-flexbox", name: "CSS Flexbox Tutorial" },
];

const semanticHits: SearchResult[] = [
  { id: "vue-composition", name: "Vue.js Composition API Guide" },
  { id: "vue-router", name: "Vue Router Basics" },
  { id: "react-hooks", name: "React Hooks Overview" },
  { id: "typescript-generics", name: "TypeScript Generics Guide" },
];

const finalResults = mergeResults(
  fuzzyHits,
  semanticHits,
  0.5, // fuzzy weight (adjust by document type)
  0.5, // semantic weight
  60, // k value
  10 // limit top 10 results
);

console.log(finalResults);
```

In this code:

1. We define `computeRrfScore` to get small scores for each rank.
2. We loop through the fuzzy list and add each item’s score to `bucket`.
3. We loop through the semantic list and add each item’s score (or increase it if it is already in the bucket).
4. We sort all items by the combined score, then take the top `limit`.

You can adjust `fuzzyWeight` or `semanticWeight` to favor one search type. If you want fuzzy to matter more for API reference, set `fuzzyWeight = 0.7` and `semanticWeight = 0.3`.

## Interactive Vue component

Below is an interactive Vue component that shows step by step how RRF adds scores and sorts items. You can copy and paste it into your Vue playground to see how changing weights affects the final order.

**What is the perfect ratio between fuzzy and semantic?**

There is no single “perfect” ratio. It depends on your content and your users. Use these simple steps to find what works best:

1. **Start at 0.5/0.5**
   Give fuzzy and semantic equal weight (0.5 each). This balanced split works well for most mixed-content sites (API docs, tutorials, blog posts).

2. **Adjust by document type**
   - **Technical reference (exact names matter)**
     Try `fuzzyWeight = 0.7` and `semanticWeight = 0.3`. Exact matches (function names, code snippets) should score higher.
   - **How-to guides or tutorials (both term and meaning matter)**
     Keep `fuzzyWeight = 0.5` and `semanticWeight = 0.5`. You want both precise keywords and conceptual matches.
   - **Blog posts or conceptual articles (meaning matters more)**
     Try `fuzzyWeight = 0.3` and `semanticWeight = 0.7`. You want to surface related ideas even if the keywords don’t match exactly.

3. **Measure and tune with real queries**
   - Run a small set of typical searches against your index.
   - Compare top results for fuzzy-heavy (0.7/0.3), balanced (0.5/0.5), and semantic-heavy (0.3/0.7).
   - Ask teammates or a few users which results feel most relevant.
   - Adjust weights until the top results feel right for your audience.

4. **Consider domain and data size**
   - If your site has thousands of very similar pages (e.g., product SKUs), a higher fuzzy weight (0.8/0.2) helps pick exact matches.
   - If your content is short snippets or conversational text, lean semantic (0.4/0.6) so you capture intent even when wording varies.

5. **Use a validation set**
   - Pick 20–50 real example queries and hand-label the ideal result order.
   - Compute RRF scores for several weight pairs and see which pair minimizes ranking errors against your labels.
   - This gives a data-driven “best ratio” for your specific use case.

In short:

- Start at 0.5/0.5.
- Move toward fuzzy (e.g., 0.7/0.3) when exact terms matter.
- Move toward semantic (e.g., 0.3/0.7) when meaning matters most.
- Test with real queries and adjust until the top-ranked items feel right.
