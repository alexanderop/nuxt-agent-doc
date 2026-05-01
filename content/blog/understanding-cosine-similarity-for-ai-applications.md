---
author: Alexander Opalic
pubDatetime: 2025-03-08T00:00:00Z
title: "How to Implement a Cosine Similarity Function in TypeScript for Vector Comparison"
slug: how-to-implement-a-cosine-similarity-function-in-typescript-for-vector-comparison
description: "Learn how to build an efficient cosine similarity function in TypeScript for comparing vector embeddings. This step-by-step guide includes code examples, performance optimizations, and practical applications for semantic search and AI recommendation systems"
tags: ["typescript", "ai", "mathematics"]
draft: false
---

To understand how an AI can understand that the word "cat" is similar to "kitten," you must realize cosine similarity. In short, with the help of embeddings, we can represent words as vectors in a high-dimensional space. If the word "cat" is represented as a vector [1, 0, 0], the word "kitten" would be represented as [1, 0, 1]. Now, we can use cosine similarity to measure the similarity between the two vectors. In this blog post, we will break down the concept of cosine similarity and implement it in TypeScript.

> 
  I won't explain how embeddings work in this blog post, but only how to use
  them.

## What Is Cosine Similarity? A Simple Explanation

The cosine similarity formula measures how similar two vectors are by examining the angle between them, not their sizes. Here's how it works in plain English:

1. **What it does**: It tells you if two vectors point in the same direction, opposite directions, or somewhere in between.

2. **The calculation**:
   - First, multiply the corresponding elements of both vectors and add these products together (the dot product)
   - Then, calculate how long each vector is (its magnitude)
   - Finally, divide the dot product by the product of the two magnitudes

3. **The result**:
   - If you get 1, the vectors point in exactly the same direction (perfectly similar)
   - If you get 0, the vectors stand perpendicular to each other (completely unrelated)
   - If you get -1, the vectors point in exactly opposite directions (perfectly dissimilar)
   - Any value in between indicates the degree of similarity

4. **Why it's useful**:
   - It ignores vector size and focuses only on direction
   - This means you can consider two things similar even if one is much "bigger" than the other
   - For example, a short document about cats and a long document about cats would show similarity, despite their different lengths

5. **In AI applications**:
   - We convert words, documents, images, etc. into vectors with many dimensions
   - Cosine similarity helps us find related items by measuring how closely their vectors align
   - This powers features like semantic search, recommendations, and content matching

## Why Cosine Similarity Matters for Modern Web Development

When you build applications with any of these features, you directly work with vector mathematics:

- **Semantic search**: Finding relevant content based on meaning, not just keywords
- **AI-powered recommendations**: "Users who liked this also enjoyed..."
- **Content matching**: Identifying similar articles, products, or user profiles
- **Natural language processing**: Understanding and comparing text meaning

All of these require you to compare vectors, and cosine similarity offers one of the most effective methods to do so.

## Visualizing Cosine Similarity

### Cosine Similarity Explained

Cosine similarity measures the cosine of the angle between two vectors, showing how similar they are regardless of their magnitude. The value ranges from:

- **+1**: When vectors point in the same direction (perfectly similar)
- **0**: When vectors stand perpendicular (no similarity)
- **-1**: When vectors point in opposite directions (completely dissimilar)

With the interactive visualization above, you can:

1. Move both vectors by dragging the colored circles at their endpoints
2. Observe how the angle between them changes
3. See how cosine similarity relates to this angle
4. Note that cosine similarity depends only on the angle, not the vectors' lengths

## Step-by-Step Example Calculation

Let me walk you through a manual calculation of cosine similarity between two simple vectors. This helps build intuition before we implement it in code.

Given two vectors: $\vec{v_1} = [3, 4]$ and $\vec{v_2} = [5, 2]$

I'll calculate their cosine similarity step by step:

**Step 1**: Calculate the dot product.

$$
\vec{v_1} \cdot \vec{v_2} = 3 \times 5 + 4 \times 2 = 15 + 8 = 23
$$

**Step 2**: Calculate the magnitude of each vector.

$$
||\vec{v_1}|| = \sqrt{3^2 + 4^2} = \sqrt{9 + 16} = \sqrt{25} = 5
$$

$$
||\vec{v_2}|| = \sqrt{5^2 + 2^2} = \sqrt{25 + 4} = \sqrt{29} \approx 5.385
$$

**Step 3**: Calculate the cosine similarity by dividing the dot product by the product of magnitudes.

$$
\cos(\theta) = \frac{\vec{v_1} \cdot \vec{v_2}}{||\vec{v_1}|| \cdot ||\vec{v_2}||}
$$

$$
= \frac{23}{5 \times 5.385} = \frac{23}{26.925} \approx 0.854
$$

Therefore, the cosine similarity between vectors $\vec{v_1}$ and $\vec{v_2}$ is approximately 0.854, which shows that these vectors point in roughly the same direction.

## Building a Cosine Similarity Function in TypeScript

Let's implement an optimized cosine similarity function in TypeScript that combines the functional approach with the more efficient `Math.hypot()` method:

```typescript
/**
 * Calculates the cosine similarity between two vectors
 * @param vecA First vector
 * @param vecB Second vector
 * @returns A value between -1 and 1, where 1 means identical
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same dimensions");
  }

  // Calculate dot product: A·B = Σ(A[i] * B[i])
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);

  // Calculate magnitudes using Math.hypot()
  const magnitudeA = Math.hypot(...vecA);
  const magnitudeB = Math.hypot(...vecB);

  // Check for zero magnitude
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  // Calculate cosine similarity: (A·B) / (|A|*|B|)
  return dotProduct / (magnitudeA * magnitudeB);
}
```

## Testing Our Implementation

Let's see how our function works with some example vectors:

```typescript
// Example 1: Similar vectors pointing in roughly the same direction
const vecA = [3, 4];
const vecB = [5, 2];
console.log(`Similarity: ${cosineSimilarity(vecA, vecB).toFixed(3)}`);
// Output: Similarity: 0.857

// Example 2: Perpendicular vectors
const vecC = [1, 0];
const vecD = [0, 1];
console.log(`Similarity: ${cosineSimilarity(vecC, vecD).toFixed(3)}`);
// Output: Similarity: 0.000

// Example 3: Opposite vectors
const vecE = [2, 3];
const vecF = [-2, -3];
console.log(`Similarity: ${cosineSimilarity(vecE, vecF).toFixed(3)}`);
// Output: Similarity: -1.000
```

Mathematically, we can verify these results:

For Example 1:
$$\text{cosine similarity} = \frac{3 \times 5 + 4 \times 2}{\sqrt{3^2 + 4^2} \times \sqrt{5^2 + 2^2}} = \frac{15 + 8}{\sqrt{25} \times \sqrt{29}} = \frac{23}{5 \times \sqrt{29}} \approx 0.857$$

For Example 2:
$$\text{cosine similarity} = \frac{1 \times 0 + 0 \times 1}{\sqrt{1^2 + 0^2} \times \sqrt{0^2 + 1^2}} = \frac{0}{1 \times 1} = 0$$

For Example 3:
$$\text{cosine similarity} = \frac{2 \times (-2) + 3 \times (-3)}{\sqrt{2^2 + 3^2} \times \sqrt{(-2)^2 + (-3)^2}} = \frac{-4 - 9}{\sqrt{13} \times \sqrt{13}} = \frac{-13}{13} = -1$$

## Complete TypeScript Solution

Here's a complete TypeScript solution that includes our cosine similarity function along with some utility methods:

```typescript
class VectorUtils {
  /**
   * Calculates the cosine similarity between two vectors
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error(
        `Vector dimensions don't match: ${vecA.length} vs ${vecB.length}`
      );
    }

    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.hypot(...vecA);
    const magnitudeB = Math.hypot(...vecB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculates the dot product of two vectors
   */
  static dotProduct(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error(
        `Vector dimensions don't match: ${vecA.length} vs ${vecB.length}`
      );
    }

    return vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  }

  /**
   * Calculates the magnitude (length) of a vector
   */
  static magnitude(vec: number[]): number {
    return Math.hypot(...vec);
  }

  /**
   * Normalizes a vector (converts to unit vector)
   */
  static normalize(vec: number[]): number[] {
    const mag = this.magnitude(vec);

    if (mag === 0) {
      return Array(vec.length).fill(0);
    }

    return vec.map(v => v / mag);
  }

  /**
   * Converts cosine similarity to angular distance in degrees
   */
  static similarityToDegrees(similarity: number): number {
    // Clamp similarity to [-1, 1] to handle floating point errors
    const clampedSimilarity = Math.max(-1, Math.min(1, similarity));
    return Math.acos(clampedSimilarity) * (180 / Math.PI);
  }
}
```

## Using Cosine Similarity in Real Web Applications

When you work with AI in web applications, you'll often need to calculate similarity between vectors. Here's a practical example:

```typescript
// Example: Semantic search implementation
function semanticSearch(
  queryEmbedding: number[],
  documentEmbeddings: DocumentWithEmbedding[]
): SearchResult[] {
  return documentEmbeddings
    .map(doc => ({
      document: doc,
      relevance: VectorUtils.cosineSimilarity(queryEmbedding, doc.embedding),
    }))
    .filter(result => result.relevance > 0.7) // Only consider relevant results
    .sort((a, b) => b.relevance - a.relevance);
}
```

## Using OpenAI Embedding Models with Cosine Similarity

While the examples above used simple vectors for clarity, real-world AI applications typically use embedding models that transform text and other data into high-dimensional vector spaces.

OpenAI provides powerful embedding models that you can easily incorporate into your applications. These models transform text into vectors with hundreds or thousands of dimensions that capture semantic meaning:

```typescript
// Example of using OpenAI embeddings with our cosine similarity function
async function compareTextSimilarity(
  textA: string,
  textB: string
): Promise<number> {
  // Get embeddings from OpenAI API
  const responseA = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-large",
      input: textA,
    }),
  });

  const responseB = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-large",
      input: textB,
    }),
  });

  const embeddingA = (await responseA.json()).data[0].embedding;
  const embeddingB = (await responseB.json()).data[0].embedding;

  // Calculate similarity using our function
  return VectorUtils.cosineSimilarity(embeddingA, embeddingB);
}
```

> 
  In a production environment, you should pre-compute embeddings for your
  content (like blog posts, products, or documents) and store them in a vector
  database (like Pinecone, Qdrant, or Milvus). Re-computing embeddings for every
  user request as shown in this example wastes resources and slows performance.
  A better approach: embed your content once during indexing, store the vectors,
  and only embed the user's query when performing a search.

OpenAI's latest embedding models like `text-embedding-3-large` have up to 3,072 dimensions, capturing extremely nuanced semantic relationships between words and concepts. These high-dimensional embeddings enable much more accurate similarity measurements than simpler vector representations.

For more information on OpenAI's embedding models, including best practices and implementation details, check out their documentation at [https://platform.openai.com/docs/guides/embeddings](https://platform.openai.com/docs/guides/embeddings).

## Conclusion

Understanding vectors and cosine similarity provides practical tools that empower you to work effectively with modern AI features. By implementing these concepts in TypeScript, you gain a deeper understanding and precise control over calculating similarity in your applications.
The interactive visualizations we've explored help you build intuition about these mathematical concepts, while the TypeScript implementation gives you the tools to apply them in real-world scenarios.
Whether you build recommendation systems, semantic search, or content-matching features, the foundation you've gained here will help you implement more intelligent, accurate, and effective AI-powered features in your web applications.

## Join the Discussion

This article has sparked interesting discussions across different platforms. Join the conversation to share your thoughts, ask questions, or learn from others' perspectives about implementing cosine similarity in AI applications.

- [Join the discussion on Hacker News →](https://news.ycombinator.com/item?id=43307541)
- [Discuss on Reddit r/typescript →](https://www.reddit.com/r/typescript/comments/1j73whg/how_to_implement_a_cosine_similarity_function_in/)

---
