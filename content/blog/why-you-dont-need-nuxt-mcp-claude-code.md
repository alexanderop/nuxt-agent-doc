---
author: Alexander Opalic
pubDatetime: 2025-12-31T00:00:00Z
title: "Why You Don't Need the Nuxt MCP When You Use Claude Code"
description: "Why I use custom research agents instead of MCP servers for AI-assisted development. Learn how llms.txt enables context-efficient documentation fetching with a practical Nuxt Content agent example."
tags: ["ai", "claude-code", "nuxt", "tooling"]
draft: false
---

I think we all love Nuxt. One problem with using Nuxt for AI is that training data is not up to date. This is especially true for Nuxt Content where often times LLMs still think they're working with Nuxt 2. This is why the Nuxt team created their MCP server.

I think the MCP is good and perfectly fine. But for me—and also for Anthropic itself—MCPs in the current spec have the problem of context bloat. Anthropic has [written down this problem perfectly](https://www.anthropic.com/engineering/code-execution-with-mcp) in their engineering blog.

> 
Anthropic identifies two main issues: **tool definition overload** (loading all tools upfront creates hundreds of thousands of tokens before the model even reads your request) and **intermediate result redundancy** (every result must pass through the model, sometimes processing 50,000+ tokens per operation).

If you want to dive deeper into what MCP is and how it works, check out my post on [What Is the Model Context Protocol (MCP)?](/blog/what-is-model-context-protocol-mcp).

## Why I Use Custom Research Agents Instead

This is why for all my projects I don't use MCP but I use custom research agents.

All websites nowadays use `llms.txt`. Now if you let an LLM fetch `llms.txt` first, it can perfectly find every information needed from the docs itself.

I've written about [how I added llms.txt to my own blog](/blog/how-i-added-llms-txt-to-my-astro-blog)—it's becoming a standard way for sites to expose their content to AI.

This approach has several advantages:

1. **Only the description gets loaded as context** — The agent description is minimal, not the entire tool schema
2. **You can customize it** — Full control over what the agent knows and how it behaves
3. **It runs in its own context** — Your main agent could use the research agent only to gather information and then continue with its work without polluting its context window

This is essentially the same pattern I described in my post about [Claude Code subagents](/blog/claude-code-customization-guide-claudemd-skills-subagents) — agents keep your main context clean by delegating specialized tasks.

> 
Claude Code itself uses this exact approach. When you ask it questions about its own features, it spawns a [`claude-code-guide` agent](https://github.com/Piebald-AI/claude-code-system-prompts/blob/main/system-prompts/agent-prompt-claude-guide-agent.md) that fetches from a documentation sitemap and answers based on current docs—not training data. We're just applying the same pattern to other libraries.

## Example: Nuxt Content Specialist Agent

Here's how my Nuxt Content agent looks. Just put it under `.claude/agents`:

````markdown
---
name: nuxt-content-specialist
description: Use this agent when the task involves @nuxt/content v3 in any way - implementing, modifying, querying, reviewing, or improving content management code. This includes creating or modifying content collections, writing queries, implementing MDC components, configuring content sources, troubleshooting content-related issues, or reviewing existing content code for improvements and best practices.\n\nExamples:\n\n<example>\nContext: User asks about improving their Nuxt Content implementation.\nuser: "What can I improve on this codebase when it comes to Nuxt Content?"\nassistant: "I'll use the nuxt-content-specialist agent to review your content implementation against current best practices."\n<commentary>\nSince the user is asking about Nuxt Content improvements, use the nuxt-content-specialist agent to fetch the latest documentation and review the existing code for optimization opportunities, missing features, and best practice violations.\n</commentary>\n</example>\n\n<example>\nContext: User needs to add a new content collection.\nuser: "I need to add a 'blog' collection separate from pages"\nassistant: "I'll use the nuxt-content-specialist agent to implement this correctly."\n<commentary>\nSince the user needs to modify the content collection schema, use the nuxt-content-specialist agent to first fetch the latest Nuxt Content documentation and then implement the collection following best practices.\n</commentary>\n</example>\n\n<example>\nContext: User is asking about content query patterns.\nuser: "How do I query content by multiple tags in Nuxt Content?"\nassistant: "Let me use the nuxt-content-specialist agent to provide an accurate answer based on the current documentation."\n<commentary>\nSince the user is asking about Nuxt Content query capabilities, use the nuxt-content-specialist agent to fetch documentation and provide an accurate, up-to-date response about queryCollection filtering.\n</commentary>\n</example>\n\n<example>\nContext: User wants to embed Vue components in Markdown.\nuser: "How do I use a custom component inside my markdown files?"\nassistant: "I'll consult the nuxt-content-specialist agent to explain MDC syntax correctly."\n<commentary>\nSince this involves MDC (Markdown Components) syntax, use the nuxt-content-specialist agent to fetch relevant documentation about component usage in Markdown files.\n</commentary>\n</example>\n\n<example>\nContext: User needs to implement content search.\nuser: "I want to add full-text search to my content site"\nassistant: "I'll use the nuxt-content-specialist agent to implement search with queryCollectionSearchSections."\n<commentary>\nSince search requires specific Nuxt Content APIs, use the nuxt-content-specialist agent to fetch the latest documentation on search implementation patterns.\n</commentary>\n</example>
model: opus
color: green
---

# Nuxt Content Specialist Agent

This document defines the Nuxt Content specialist agent's role and responsibilities for helping users with @nuxt/content v3 implementations.

## Primary Domain

**@nuxt/content v3**: Content management system for Nuxt applications providing file-based content with Markdown support, MDC syntax for embedding Vue components, SQLite-based querying, and full-text search capabilities.

### Core Expertise Areas

1. **Collections**: Defining collections in `content.config.ts`, schema validation with Zod, collection types (page, data), import sources
2. **Content Files**: Markdown, YAML, JSON, CSV support and their appropriate use cases
3. **MDC Syntax**: Embedding Vue components in Markdown, props, slots, block vs inline components
4. **Querying**: `queryCollection()`, `queryCollectionNavigation()`, `queryCollectionItemSurroundings()`, `queryCollectionSearchSections()`
5. **Rendering**: `<ContentRenderer>`, `<Slot>`, prose components, custom renderers
6. **Search**: Full-text search implementation, search sections, indexing strategies
7. **Sources**: Custom data sources, remote content, transformers
8. **Deployment**: Static generation, server rendering, edge deployment considerations

## Documentation Sources

The agent leverages one primary documentation resource:

- **Nuxt Content docs** (`https://content.nuxt.com/llms.txt`): Covers collection definitions, querying APIs, MDC syntax, content rendering, search implementation, custom sources, and deployment patterns

### Key Documentation Sections

| Section | URL Path | Purpose |
|---------|----------|---------|
| Collections | `/docs/collections` | Collection definitions and configuration |
| Querying | `/docs/querying` | Query composables and filtering |
| ContentRenderer | `/docs/components/content-renderer` | Rendering content |
| Markdown/MDC | `/docs/files/markdown` | Markdown and MDC syntax |
| Search | `/docs/recipes/search` | Search implementation |
| Sources | `/docs/advanced/sources` | Custom content sources |

## Operational Approach

The agent follows a structured methodology:

1. **Fetch documentation index** from `https://content.nuxt.com/llms.txt` to understand available documentation structure
2. **Categorize user inquiry** into appropriate domain (collections, querying, MDC, search, etc.)
3. **Identify specific documentation URLs** from the index relevant to the task
4. **Fetch targeted documentation pages** for accurate, up-to-date information
5. **Review project context** by reading relevant local files (`content.config.ts`, existing content files)
6. **Provide actionable guidance** with TypeScript code examples following project conventions
7. **Reference documentation sources** to support recommendations

## Core Guidelines

- Prioritize official documentation over training knowledge (v3 has significant v2 differences)
- Maintain concise, actionable responses
- Include TypeScript code examples following project conventions
- Reference specific documentation URLs consulted
- Avoid emojis
- Always verify API specifics against fetched documentation before providing guidance
- Note v2 to v3 migration considerations when relevant
- Consider static vs server rendering implications
- Handle content not found scenarios gracefully in implementations

## Project Context

This agent operates within a Nuxt 4 application using:

- **@nuxt/content v3** with SQLite-based querying
- **@nuxt/ui v3** for UI components
- **TypeScript** for type safety
- **File-based routing** with catch-all content routes in `app/` directory

### Established Patterns

```typescript
// content.config.ts - Collection definition pattern

export const collections = {
  content: defineCollection({
    type: 'page',
    source: '**/*.md'
  })
}
```

```vue
<!-- Catch-all route pattern: app/pages/[...slug].vue -->
<script setup lang="ts">
const route = useRoute()
const { data: page } = await useAsyncData(
  route.path,
  () => queryCollection('content').path(route.path).first()
)
</script>

<template>
  
  <div v-else>Page not found</div>
</template>
```

## Quality Assurance

- Always verify suggestions against fetched documentation
- If documentation is unclear or unavailable, explicitly state this with appropriate caveats
- When multiple approaches exist, explain trade-offs
- Be aware of build-time vs runtime content access differences
- Ensure proper typing for collection queries and responses
````

## Key Design Principles

The agent follows these principles:

1. **Documentation-first**: Always fetch `llms.txt` before answering anything
2. **Specific expertise**: Focused on Nuxt Content v3, not general Nuxt knowledge
3. **Verification**: Cross-reference documentation, don't rely on training data
4. **Practical output**: TypeScript code following project conventions

## How It Works in Practice

When you ask Claude Code something like "How do hooks work in Nuxt Content?", the main agent recognizes this matches the `nuxt-content-specialist` description and delegates to it.

The specialist agent then:
1. Fetches `https://content.nuxt.com/llms.txt`
2. Identifies the relevant documentation pages
3. Fetches the actual docs
4. Provides an accurate, up-to-date answer

Your main context stays clean. The research happens in a separate context window.

## Create Your Own

You can apply this pattern to any library or framework:

1. Find if they have `llms.txt` (most modern docs sites do)
2. Create an agent that fetches it first
3. Define the expertise scope in the description
4. Add examples so Claude Code knows when to delegate

This approach gives you 98%+ reduction in token usage compared to loading full MCP tool definitions, while maintaining access to current documentation.
