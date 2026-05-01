---
author: Alexander Opalic
pubDatetime: 2025-03-03T00:00:00Z
title: "How I Added llms.txt to My Astro Blog"
slug: how-i-added-llms-txt-to-my-astro-blog
description: "I built a simple way to load my blog content into any LLM with one click. This post shows how you can do it too."
tags: ["astro", "ai"]
draft: false
---

## TLDR

I created an endpoint in my Astro blog that outputs all posts in plain text format. This lets me copy my entire blog with one click and paste it into any LLM with adequate context window. The setup uses TypeScript and Astro's API routes, making it work with any Astro content collection.

## Why I Built This

I wanted a quick way to ask AI models questions about my own blog content. Copying posts one by one is slow. With this solution, I can give any LLM all my blog posts at once.

## How It Works

The solution creates a special endpoint that:

1. Gets all blog posts
2. Converts them to plain text
3. Formats them with basic metadata
4. Outputs everything as one big text file

## Setting Up the File

First, I created a new TypeScript file in my Astro pages directory:

```ts
// src/pages/llms.txt.ts
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

// Function to extract the frontmatter as text
const extractFrontmatter = (content: string): string => {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  return frontmatterMatch ? frontmatterMatch[1] : "";
};

// Function to clean content while keeping frontmatter
const cleanContent = (content: string): string => {
  // Extract the frontmatter as text
  const frontmatterText = extractFrontmatter(content);

  // Remove the frontmatter delimiters
  let cleanedContent = content.replace(/^---\n[\s\S]*?\n---/, "");

  // Clean up MDX-specific imports
  cleanedContent = cleanedContent.replace(
    /import\s+.*\s+from\s+['"].*['"];?\s*/g,
    ""
  );

  // Remove MDX component declarations
  cleanedContent = cleanedContent.replace(/<\w+\s+.*?\/>/g, "");

  // Remove Shiki Twoslash syntax like
  cleanedContent = cleanedContent.replace(/\/\/\s*@noErrors/g, "");
  cleanedContent = cleanedContent.replace(/\/\/\s*@(.*?)$/gm, ""); // Remove other Shiki Twoslash directives

  // Clean up multiple newlines
  cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, "\n\n");

  // Return the frontmatter as text, followed by the cleaned content
  return frontmatterText + "\n\n" + cleanedContent.trim();
};

export const GET: APIRoute = async () => {
  try {
    // Get all blog posts sorted by date (newest first)
    const posts = await getCollection("blog", ({ data }) => !data.draft);
    const sortedPosts = posts.sort(
      (a, b) =>
        new Date(b.data.pubDatetime).valueOf() -
        new Date(a.data.pubDatetime).valueOf()
    );

    // Generate the content
    let llmsContent = "";

    for (const post of sortedPosts) {
      // Add post metadata in the format similar to the example
      llmsContent += `--- title: ${post.data.title} description: ${post.data.description} tags: [${post.data.tags.map(tag => `'${tag}'`).join(", ")}] ---\n\n`;

      // Add the post title as a heading
      llmsContent += `# ${post.data.title}\n\n`;

      // Process the content, keeping frontmatter as text
      const processedContent = cleanContent(post.body);
      llmsContent += processedContent + "\n\n";

      // Add separator between posts
      llmsContent += "---\n\n";
    }

    // Return the response as plain text
    return new Response(llmsContent, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Failed to generate llms.txt:", error);
    return new Response("Error generating llms.txt", { status: 500 });
  }
};
```

This code accomplishes four key functions:

1. It uses Astro's `getCollection` function to grab all published blog posts
2. It sorts them by date with newest first
3. It cleans up each post's content with helper functions
4. It formats each post with its metadata and content
5. It returns everything as plain text

## How to Use It

Using this is simple:

1. Visit `alexop.dev/llms.txt` in your browser
2. Press Ctrl+A (or Cmd+A on Mac) to select all the text
3. Copy it (Ctrl+C or Cmd+C)
4. Paste it into any LLM with adequate context window (like ChatGPT, Claude, Llama, etc.)
5. Ask questions about your blog content

The LLM now has all your blog posts in its context window. You can ask questions such as:

- "What topics have I written about?"
- "Summarize my post about [topic]"
- "Find code examples in my posts that use [technology]"
- "What have I written about [specific topic]?"

## Benefits of This Approach

This approach offers distinct advantages:

- Works with any Astro blog
- Requires a single file to set up
- Makes your content easy to query with any LLM
- Keeps useful metadata with each post
- Formats content in a way LLMs understand well

## Conclusion

By adding one straightforward TypeScript file to your Astro blog, you can create a fast way to chat with your own content using any LLM with adequate context window. This makes it easy to:

- Find information in your old posts
- Get summaries of your content
- Find patterns across your writing
- Generate new ideas based on your past content

Give it a try! The setup takes minutes, and it makes interacting with your blog content much faster.
