---
author: Alexander Opalic
pubDatetime: 2025-05-18T00:00:00Z
modDatetime: 2025-05-18T00:00:00Z
title: "No Server, No Database: Smarter Related Posts in Astro with `transformers.js`"
slug: semantic-related-posts-astro-transformersjs
draft: false
tags:
  - ai
  - astro
  - typescript
description: "How I used Hugging Face embeddings to create smart “Related Posts” for my Astro blog—no backend, no database, just TypeScript."
---

I recently read a interesting blog post about Embeddings at [Embeddings in Technical Writing](https://technicalwriting.dev/ml/embeddings/overview.html):

> “I could tell you exactly how to advance technical writing with embeddings, but where’s the fun in that?”

Challenge accepted!
In this post, I show how I used **Hugging Face’s `transformers.js`** to create smarter related-post suggestions for my Astro blog, without servers or databases.

## Why Embeddings Are Better Than Tags

Tags group posts by labels, but not by meaning. Posts about Vue 3 and deep reactivity concepts get mixed up together.
Embeddings capture the meaning of text using numeric vectors. Two posts become related when their content is similar, not just when tags match.

### Vectors and Cosine Similarity

Words like “cat” and “kitty” are close in meaning, while “dog” is slightly different:

| word  | vector     |
| ----- | ---------- |
| cat   | `[0, 1]`   |
| kitty | `[0, 0.9]` |
| dog   | `[1, -1]`  |

Cosine similarity measures how similar these vectors are.
For a deeper dive into TypeScript and vectors, check out my post on [How to Implement a Cosine Similarity Function in TypeScript for Vector Comparison](../how-to-implement-a-cosine-similarity-function-in-typescript-for-vector-comparison/).

## Transformers.js in Action

`transformers.js` lets you run Hugging Face models directly in JavaScript:

```ts
import { pipeline } from "@huggingface/transformers";

const model = "sentence-transformers/all-MiniLM-L6-v2";
const extractor = await pipeline("feature-extraction", model);

const embedding = await extractor("Hello, world!", {
  pooling: "mean",
  normalize: true,
});

console.log(embedding); // Float32Array with 384 dimensions
```

You don't need Python or a server. Everything runs in your browser or Node.js.

## My Simple Workflow

Here's how my workflow works:

1. Load markdown files (`.md` or `.mdx`) from my blog.
2. Remove markdown formatting to get plain text.
3. Use `transformers.js` to create embeddings.
4. Calculate cosine similarity between all posts.
5. Find the top 5 most related posts for each post.
6. Save the results in a JSON file (`similarities.json`).
7. Display these related posts with Astro.

### Main Script (TypeScript)

```ts
import { pipeline, FeatureExtractionPipeline } from "@huggingface/transformers";
import chalk from "chalk";
import fs from "fs";
import { glob } from "glob";
import matter from "gray-matter";
import { remark } from "remark";
import strip from "strip-markdown";
import path from "path";

// --------- Configurations ---------
const GLOB = "src/content/**/*.{md,mdx}"; // Where to find Markdown content
const OUT = "src/assets/similarities.json"; // Output file for results
const TOP_N = 5; // Number of similar docs to keep
const MODEL = "Snowflake/snowflake-arctic-embed-m-v2.0"; // Embedding model

// --------- Type Definitions ---------
interface Frontmatter {
  slug: string;
  [k: string]: unknown;
}
interface Document {
  path: string;
  content: string;
  frontmatter: Frontmatter;
}
interface SimilarityResult extends Frontmatter {
  path: string;
  similarity: number;
}

// --------- Utils ---------

/**
 * Normalizes a vector to unit length (L2 norm == 1)
 * This makes cosine similarity a simple dot product!
 */
function normalize(vec: Float32Array): Float32Array {
  let len = Math.hypot(...vec); // L2 norm
  if (!len) return vec;
  return new Float32Array(vec.map(x => x / len));
}

/**
 * Computes dot product of two same-length vectors.
 * Vectors MUST be normalized before using this for cosine similarity!
 */
const dot = (a: Float32Array, b: Float32Array) =>
  a.reduce((sum, ai, i) => sum + ai * b[i], 0);

/**
 * Strips markdown formatting, import/export lines, headings, tables, etc.
 * Returns plain text for semantic analysis.
 */
const getPlainText = async (md: string) => {
  let txt = String(await remark().use(strip).process(md))
    .replace(/^import .*?$/gm, "")
    .replace(/^export .*?$/gm, "")
    .replace(
      /^\s*(TLDR|Introduction|Conclusion|Summary|Quick Setup Guide|Rules?)\s*$/gim,
      ""
    )
    .replace(/^[A-Z\s]{4,}$/gm, "")
    .replace(/^\|.*\|$/gm, "")
    .replace(/(Rule\s\d+:.*)(?=\s*Rule\s\d+:)/g, "$1\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n{2}/g, "\n\n")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return txt;
};

/**
 * Parses and validates a single Markdown file.
 * - Extracts frontmatter (slug, etc.)
 * - Converts content to plain text
 * - Skips drafts or files with no slug
 */
async function processFile(path: string): Promise<Document | null> {
  try {
    const { content, data } = matter(fs.readFileSync(path, "utf-8"));
    if (!data.slug || data.draft) return null;
    const plain = await getPlainText(content);
    return { path, content: plain, frontmatter: data as Frontmatter };
  } catch {
    return null;
  }
}

/**
 * Processes an array of Markdown file paths into Documents
 */
async function loadDocs(paths: string[]) {
  const docs: Document[] = [];
  for (const p of paths) {
    const d = await processFile(p);
    if (d) docs.push(d);
  }
  return docs;
}

/**
 * Generates vector embeddings for each document's plain text.
 * - Uses HuggingFace model
 * - Normalizes each vector for fast cosine similarity search
 */
async function embedDocs(
  docs: Document[],
  extractor: FeatureExtractionPipeline
) {
  if (!docs.length) return [];
  // Don't let the model normalize, we do it manually for safety
  const res = (await extractor(
    docs.map(d => d.content),
    { pooling: "mean", normalize: false }
  )) as any;
  const [n, dim] = res.dims;
  // Each embedding vector is normalized for performance
  return Array.from({ length: n }, (_, i) =>
    normalize(res.data.slice(i * dim, (i + 1) * dim))
  );
}

/**
 * Computes the top-N most similar documents for the given document index.
 * - Uses dot product of normalized vectors for cosine similarity
 * - Returns only the top-N
 */
function topSimilar(
  idx: number,
  docs: Document[],
  embs: Float32Array[],
  n: number
): SimilarityResult[] {
  return docs
    .map((d, j) =>
      j === idx
        ? null
        : {
            ...d.frontmatter,
            path: d.path,
            similarity: +dot(embs[idx], embs[j]).toFixed(2), // higher = more similar
          }
    )
    .filter(Boolean)
    .sort((a, b) => (b as any).similarity - (a as any).similarity)
    .slice(0, n) as SimilarityResult[];
}

/**
 * Computes all similarities for every document, returns as {slug: SimilarityResult[]} map.
 */
function allSimilarities(docs: Document[], embs: Float32Array[], n: number) {
  return Object.fromEntries(
    docs.map((d, i) => [d.frontmatter.slug, topSimilar(i, docs, embs, n)])
  );
}

/**
 * Saves result object as JSON file.
 * - Ensures output directory exists.
 */
async function saveJson(obj: any, out: string) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(obj, null, 2));
}

// --------- Main Execution Flow ---------
async function main() {
  try {
    // 1. Load transformer model for embeddings
    const extractor = await pipeline("feature-extraction", MODEL);

    // 2. Find all Markdown files
    const files = await glob(GLOB);
    if (!files.length)
      return console.log(chalk.yellow("No content files found."));

    // 3. Parse and process all files
    const docs = await loadDocs(files);
    if (!docs.length) return console.log(chalk.red("No documents loaded."));

    // 4. Generate & normalize embeddings
    const embs = await embedDocs(docs, extractor);
    if (!embs.length) return console.log(chalk.red("No embeddings."));

    // 5. Calculate similarities for each doc
    const results = allSimilarities(docs, embs, TOP_N);

    // 6. Save results to disk
    await saveJson(results, OUT);
    console.log(chalk.green(`Similarity results saved to ${OUT}`));
  } catch (e) {
    console.error(chalk.red("Error:"), e);
    process.exitCode = 1;
  }
}

main();
```

## This Will Produce a JSON file with the following structure:

```json
{
  "vue-introduction": [
    {
      "slug": "typescript-advanced-types",
      "title": "Advanced Types in TypeScript",
      "date": "2024-06-03T00:00:00.000Z",
      "path": "src/content/typescript-advanced-types.md",
      "similarity": 0.35
    }
    // Additional similar documents...
  ]
  // Additional document entries...
}
```

### Astro Component

```astro
---
import sims from "../assets/similarities.json";

if (similarities[post.slug]) {
  mostRelatedPosts = similarities[post.slug]
    .filter((p: RelatedPost) => !p.draft)
    .sort(
      (a: RelatedPost, b: RelatedPost) =>
        (b.similarity ?? 0) - (a.similarity ?? 0)
    )
    .slice(0, 3);
}
---

{
  mostRelatedPosts.length > 0 && (
    <div data-pagefind-ignore class="mb-8 mt-16">
      <h2 class="mb-6 text-3xl font-bold text-skin-accent">
        Most Related Posts
      </h2>
      <div class="md:grid-cols-3 grid grid-cols-1 gap-6">
        {mostRelatedPosts.map((relatedPost: RelatedPost) => (
          <a
            href={`/posts/${relatedPost.slug}/`}
            class="related-post-card group"
          >
            <div class="p-5">
              <h3 class="related-post-title">{relatedPost.title}</h3>
              <p class="related-post-description">{relatedPost.description}</p>
              <div class="flex items-center justify-between text-xs text-skin-base text-opacity-60">
                <Datetime
                  pubDatetime={relatedPost.pubDatetime}
                  modDatetime={relatedPost.modDatetime}
                  size="sm"
                />
                <span class="related-post-tag">{relatedPost.tags?.[0]}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
```

## Does It Work?

Yes! Now, my blog suggests truly related content, not random posts.

---

## What I Learned

- **No extra servers or databases**: Everything runs during build time.
- **Easy to use**: Works in both browsers and Node.js.
- **Flexible**: Quickly change the model or method.

If you have a static blog and want better recommendations, give embeddings and Astro a try. Let me know how it goes!

Of course, this is far from perfect. I also don't know which model would be ideal, but at the moment I'm getting much better related posts than before, so I'm happy with the results.
If you want to play with the script yourself check out [post-matcher-ai](https://github.com/alexanderop/post-matcher-ai)
