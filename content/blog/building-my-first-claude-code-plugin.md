---
author: Alexander Opalic
pubDatetime: 2025-11-08T00:00:00Z
title: "Building My First Claude Code Plugin"
slug: building-my-first-claude-code-plugin
description: "How I built a Claude Code plugin to generate skills, agents, commands, and more—and stopped copy-pasting boilerplate."
tags: ["claude-code", "ai", "tooling", "productivity"]
draft: false
---

> 
  If you're unfamiliar with Claude Code or want to understand the full ecosystem (MCP, Skills, Subagents, Hooks, and Plugins), check out my{" "}
  [
    comprehensive guide to Claude Code's full stack
  ](/blog/understanding-claude-code-full-stack)
  {" "}first. This post assumes you know the basics.

## The Problem

I've been using Claude Code for a while now. It's been my daily driver for development work, alongside [other AI tools in my workflow](/blog/how-i-use-llms).

But here's the thing—over the last few months, I stopped paying attention to what Anthropic was shipping. Skills? Didn't look into them. Plugins? No idea they existed.

Today I caught up. And I discovered something I'd been missing: plugins.

The idea clicked immediately. Everything I'd been building locally—custom commands, agents, configurations—was stuck in `.claude/` folders per project. Plugins change that. You can package it up and share it across projects. Give Claude Code new abilities anywhere.

That's when I decided to build one. A plugin that generates slash commands, skills, agents, and everything else I kept creating manually.

> 
The plugin is open source and ready to use. Check out the repository on GitHub to see the implementation or install it right away.

[View on GitHub](https://github.com/alexanderop/claude-code-builder)

> 
Plugins extend Claude Code with custom commands, agents, hooks, Skills, and MCP servers through the plugin system. They let you package up functionality and share it across projects and teams.

Plugins can contain:

- **Slash commands** – Custom workflows you trigger explicitly (like `/analyze-deps`)
- **Skills** – Abilities Claude automatically uses when relevant
- **Agents** – Specialized sub-agents for focused tasks
- **Hooks** – Event handlers that run on tool use, prompt submit, etc.

For complete technical specifications and the official guide, see the [Claude Code Plugins documentation](https://code.claude.com/docs/en/plugins).

## The Manual Workflow Was Painful

Before the plugin, creating a new command looked like this:

1. Search the docs for the right frontmatter format
2. Create `.claude/commands/my-command.md`
3. Copy-paste a template
4. Fill in the blanks
5. Hope you got the structure right

Repeat for agents. Repeat for skills. Repeat for hooks.

10 minutes on boilerplate. 5 minutes on actual logic.

Same problem every time: too much manual work for something that should be instant.

## The Solution: Claude Code Builder

I fixed this by building a plugin that generates everything for me.

Here's what it includes:

| Command                | Description                                  |
| ---------------------- | -------------------------------------------- |
| `/create-skill`        | Generate model-invoked skills                |
| `/create-agent`        | Create specialized sub-agents                |
| `/create-command`      | Add custom slash commands                    |
| `/create-hook`         | Configure event-driven hooks                 |
| `/create-md`           | Generate CLAUDE.md files for project context |
| `/create-output-style` | Create custom output styles                  |
| `/create-plugin`       | Package your setup as a plugin               |

Each command handles the structure, frontmatter, and best practices. I just provide the name and description.

## The Plugin Structure

Here's the structure:

## Command Files: Where the Magic Happens

Each command is a markdown file with frontmatter. Here's the `/create-skill` command as an example:

```markdown
---
description: Generate a new Claude Skill with proper structure and YAML frontmatter
argument-hint: [skill-name] [description]
---

# /create-skill

## Purpose

Generate a new Claude Skill with proper structure and YAML frontmatter using official documentation as reference

## Contract

**Inputs:**

- `$1` — SKILL_NAME (lowercase, kebab-case, max 64 characters)
- `$2` — DESCRIPTION (what the skill does and when to use it, max 1024 characters)
- `--personal` — create in ~/.claude/skills/ (default)
- `--project` — create in .claude/skills/

**Outputs:** `STATUS=<CREATED|EXISTS|FAIL> PATH=<path>`

## Instructions

1. **Validate inputs:**
   - Skill name: lowercase letters, numbers, hyphens only
   - Description: non-empty, max 1024 characters

2. **Determine target directory:**
   - Personal (default): `~/.claude/skills/{{SKILL_NAME}}/`
   - Project: `.claude/skills/{{SKILL_NAME}}/`

3. **Generate SKILL.md using this template:**
   [template content here...]
```

> 
  Commands are just instructions for Claude. Write them like you're teaching a
  junior developer the exact steps to follow. Good{" "}
  [
    prompt engineering principles
  ](/blog/xml-tagged-prompts-framework-reliable-ai-responses){" "}
  apply here too.

Here's what the plugin generates when you run a command:

## Publishing to GitHub

Once I had it working locally, publishing was straightforward:

1. Push to GitHub
2. Users add the marketplace: `/plugin marketplace add alexanderop/claude-code-builder`
3. Users install: `/plugin install claude-code-builder@claude-code-builder`

No npm, no build step. Just GitHub.

## Try It Yourself

Ready to stop copy-pasting Claude Code boilerplate?

**Step 1: Install the plugin**

```bash
/plugin install claude-code-builder@claude-code-builder
```

**Step 2: Verify installation**

Check that the plugin is loaded:

```bash
/plugins
```

You should see `claude-code-builder` in the list.

**Step 3: Use the new commands**

You now have access to seven new commands. Try creating your first skill:

```bash
/create-skill commit-helper "Generate clear commit messages; use when committing"
```

That's it. You're now equipped to generate skills, agents, commands, and more—without touching the docs.

## What's Next?

I'm using this daily. Every time I think "I wish Claude could...", I run `/create-skill` instead of Googling docs.

Right now, I'm focused on workflow optimization: building Vue applications faster with Claude Code.

The question I'm exploring: How do I teach Claude Code to write good Vue applications?

I'm working on:

- Skills that encode Vue best practices
- Commands for common Vue patterns (composables, stores, components)
- Custom agents that understand Vue architecture decisions
- [
    MCP server integrations
  ](/blog/what-is-model-context-protocol-mcp)
  for external tools

It's not just about speed. It's about teaching Claude Code the way I think about development.

Building tools that build tools. That's where it gets fun.
