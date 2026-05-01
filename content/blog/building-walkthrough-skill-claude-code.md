---
author: Alexander Opalic
pubDatetime: 2026-02-08T00:00:00Z
title: "Building a Walkthrough Skill for AI Coding Agents"
slug: building-walkthrough-skill-claude-code
description: "How I built a skill that generates interactive codebase walkthroughs with clickable Mermaid diagrams—works with Claude Code, Amp, and any agent that supports the skills standard."
tags: ["claude-code", "ai", "tooling", "skills"]
draft: false
---

I'm a visual learner. When I join a new codebase or try to understand a complex flow, I need a diagram. Reading files one by one doesn't give me the mental model I need—I need to see the connections.

That's why Amp's [Shareable Walkthroughs](https://ampcode.com/news/walkthrough) caught my attention. The idea is simple: ask your AI coding tool to explain a feature, and it generates an interactive diagram where you can click through nodes to drill into the details.

I couldn't find the source code for Amp's implementation. So I built my own.

> 
The skill is open source and ready to install:

[View on GitHub](https://github.com/alexanderop/walkthrough)

Quick install: `npx skills add https://github.com/alexanderop/walkthrough --skill walkthrough`

## What It Does

You ask your agent something like "walkthrough how does authentication work" and it:

1. Spawns 2–4 subagents to explore relevant parts of your codebase in parallel
2. Synthesizes findings into 5–12 key concepts with connections
3. Generates a self-contained HTML file with an interactive Mermaid diagram
4. Opens it in your browser

Each node in the diagram is clickable. Click one and a detail panel slides in with a plain-English description, file paths, and optional code snippets. The whole thing is designed to give you a mental model in under two minutes.

Here's a live example—this walkthrough explains how the skill itself works. Click on any node to see the details:

<iframe
  src="https://alexanderop.github.io/walkthrough/examples/walkthrough-how-it-works.html"
  title="Walkthrough skill: how it works"
  style="width: 100%; height: 600px; border: 1px solid #2a2a2a; border-radius: 8px;"
  loading="lazy"
  allow="fullscreen"
/>

> 
Skills aren't exclusive to Claude Code. They're a [shared standard](https://skills.dev/) supported by multiple AI coding agents—Claude Code, Amp, and others. A skill you write once works across all of them. If you're new to skills in Claude Code specifically, check out my [guide to CLAUDE.md, skills, and subagents](/blog/claude-code-customization-guide-claudemd-skills-subagents).

## How the Skill Works

The walkthrough above shows the full pipeline. Let me walk through the four phases.

### Phase 1: Trigger

Everything starts with a natural-language prompt. When you type something like "walkthrough how does auth work", your agent matches the trigger pattern in the skill definition and activates the walkthrough workflow.

### Phase 2: Skill Configuration

The skill consists of two files:

`skill.md` defines the four-step workflow: scope the question, launch subagents, synthesize findings, generate HTML. It also includes a quality checklist—things like keeping diagrams to 5–12 nodes and writing descriptions in plain English.

`html-patterns.md` is the complete reference for the generated output: React components, Mermaid configuration, the color palette, pan/zoom implementation, and Shiki syntax highlighting setup. The agent reads this file and follows the patterns when generating the HTML.

### Phase 3: Exploration

This is where it gets interesting. Instead of having one agent read through your entire codebase, the skill uses subagents to parallelize the exploration:

1. **Scope understanding** — The main agent clarifies what you're asking about and identifies which areas of the codebase are relevant
2. **Parallel subagents** — 2–4 Explore subagents investigate specific regions concurrently, each returning a structured report with purpose, connections, node suggestions, file paths, and key code snippets
3. **Synthesis** — The main agent combines all reports into a single list of nodes, edges, and subgroup groupings

The subagents do the reading. The main agent does the thinking. This keeps the output coherent while making exploration fast.

### Phase 4: Generation

With the synthesized data, the agent picks the right diagram type—flowchart for feature flows and architecture, ER diagram for database schemas—and generates a self-contained HTML file. No build step, no dependencies to install. It loads everything from CDNs:

- **React 18** for the interactive UI
- **Mermaid 11** for diagram rendering
- **Tailwind CSS** for styling
- **Shiki** for syntax highlighting in code snippets

The design is dark-only with a pure black background and purple accents. Every diagram node is clickable via Mermaid's callback system, and there's scroll-to-zoom and drag-to-pan for larger diagrams. The file opens directly in your browser.

And here's what happens when I ask the skill to onboard me on this very blog's codebase:

```
walkthrough help me to onboard on this project
```

<iframe
  src="/walkthrough-project-overview.html"
  title="Walkthrough: AstroPaper blog project overview"
  style="width: 100%; height: 600px; border: 1px solid #2a2a2a; border-radius: 8px;"
  loading="lazy"
  allow="fullscreen"
/>

Five content collections, a presentation engine, educational visualizers, OG image generation—all mapped out in one interactive diagram. Click any node to see what it does and where it lives.

## Example Prompts

Here are some ways I use it:

```
walkthrough how does the presentation mode work
```

```
walkthrough explain the authentication flow when a user signs up
```

```
walkthrough database schema for the content management system, use an ER diagram
```

## Why I Built This

I've written about [using AI for diagrams](/blog/how-to-use-ai-for-effective-diagram-creation-a-guide-to-chatgpt-and-mermaid) before. The pattern is always the same—I need to see the system before I can reason about it.

Existing tools either require you to manually write diagram code or generate static images. What I wanted was something interactive where I could start at the high level and drill down only into the parts that matter.

The walkthrough skill fills that gap. It's the onboarding tool I wish every codebase had.

## Conclusion

- Skills are a standard—this works with Claude Code, Amp, and any agent that supports them
- Subagents make codebase exploration fast by parallelizing reads
- Self-contained HTML with CDN dependencies means zero setup for viewers
- The skill is open source at [github.com/alexanderop/walkthrough](https://github.com/alexanderop/walkthrough)

If you're a visual thinker like me, give it a try. Ask it to explain something in your codebase and see what comes out.
