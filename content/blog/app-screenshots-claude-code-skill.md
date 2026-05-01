---
author: Alexander Opalic
pubDatetime: 2026-03-27T00:00:00Z
title: "App Screenshots: An AI Coding Agent Skill for Visual Documentation"
description: "Automate annotated screenshot documentation for any web app or live website using an AI coding agent skill. Works with Claude Code, Cursor, Windsurf, or any agent that supports custom skills."
draft: false
tags:
  - ai
  - coding-agents
  - tooling
---

## TLDR

I built a [skill](https://github.com/alexanderop/app-screenshots) that takes annotated screenshots of any web app or live website and generates a markdown visual guide. It works with Claude Code, Cursor, Windsurf, or any AI coding agent that supports custom skills.

## What Is a Skill?

A skill is a markdown file with instructions for a coding agent. It describes how to perform a specific task and can reference CLI tools, APIs, or other resources. You write the steps in markdown, the agent follows them. A general-purpose coding agent with the right skill becomes a specialist, no code changes needed. For a deeper look at how skills fit into the broader ecosystem, see the [guide to CLAUDE.md, skills, and subagents](/blog/claude-code-customization-guide-claudemd-skills-subagents).

## The Problem

Documenting UIs is tedious. You open the app, take a screenshot, annotate it in some tool, write descriptions, repeat for every page. Automate it.

## How It Works

The skill uses [`agent-browser`](https://github.com/vercel-labs/agent-browser), a headless browser automation CLI built by Vercel specifically for AI agents. Instead of heavy tools like Playwright, it provides a lightweight snapshot + refs system that lets agents navigate, click, and screenshot pages with minimal context usage. It works with Claude Code, Codex, Cursor, Gemini CLI, and more.

You point your coding agent at a local dev server or a public URL and it does the rest:

1. **Discovers pages** by reading the site's navigation
2. **Screenshots each page** with SVG annotations injected directly into the DOM
3. **Generates a markdown file** with numbered references to each annotation

Annotations come in three types: `box` for sections, `click` for interactive elements, and `circle` for general callouts. Each screenshot gets up to 3 annotations with auto-rotating colors. If you like auto-generated visual docs, the [walkthrough skill](/blog/building-walkthrough-skill-claude-code) does something similar for codebases with interactive Mermaid diagrams.

```markdown
## Homepage

The landing page shows a hero banner with seasonal promotions.
Use the **Search** bar (1) to find products.
The **Category navigation** (2) provides access to all departments.

![Homepage](screenshots/01-homepage.png)
```

## Live Sites Just Work

It handles cookie banners, lazy-loaded content, bot protection. You can document `otto.de`, `github.com`, or your own staging environment with the same command.

## Usage

Install the prerequisite:

```bash
npm install -g agent-browser && agent-browser install
```

Then tell your coding agent:

```
"Screenshot the app"
"Document otto.de with screenshots"
"Give me a visual guide of the checkout flow"
```

The skill figures out whether you mean a local dev server or a live URL and adapts accordingly.

## Source

GitHub: [github.com/alexanderop/app-screenshots](https://github.com/alexanderop/app-screenshots)

If you're building your own skill library, see how I built a skill for [searching Claude's conversation history](/blog/building-conversation-search-skill-claude-code).
