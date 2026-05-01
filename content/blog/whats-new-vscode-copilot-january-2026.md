---
author: Alexander Opalic
pubDatetime: 2026-01-24T00:00:00Z
modDatetime: 2026-01-24T12:00:00Z
title: "What's New in VS Code Copilot: January 2026 Update"
description: "Major updates to VS Code Copilot including parallel subagent execution, a new skills system, deeper Claude integration with extended thinking, terminal improvements with kitty keyboard protocol, and instruction files that now work everywhere."
tags: ["ai", "tooling", "vscode"]
draft: false
---

The past week has brought a wave of updates to VS Code's Copilot experience, with major improvements to how agents work together, a new skills system, deeper Claude integration, and significant terminal enhancements. Here's what you need to know—with concrete examples you can try today.

For those who want to dive deeper into the implementation details, I've included links to the relevant GitHub pull requests and issues throughout this post.

---

## Subagents Get Smarter (and Faster)

Two significant changes make subagents far more practical for complex workflows.

**Related:** [Issue #274630 - Parallel subagent execution](https://github.com/microsoft/vscode/issues/274630)

### Parallel Execution

Previously, if you kicked off multiple `runSubagent` calls, they'd run one after another. Now they can run simultaneously when tasks are independent, dramatically reducing wait times for research and code review operations.

**Example prompt:**
```
Research the best approaches for:
1. Rate limiting in our REST API
2. Caching strategies for our database queries
3. Error handling patterns for our microservices

Use a subagent for each topic and compile the findings.
```

With parallel execution, all three research subagents run concurrently instead of sequentially—cutting total wait time significantly.

### Fine-Grained Tool Access

You can now constrain which tools a subagent can access. This is critical for safety-conscious workflows where you want AI help without the risk of unintended changes.

**Creating a custom agent with restricted tools:**

Create a file at `.github/agents/github-researcher.md`:

```markdown
---
name: github-researcher
description: Research agent with access to GitHub. Use for searching issues,
             reading documentation, and gathering information. Cannot edit files.
tools: ['read', 'search', 'web', 'github/*']
argument-hint: The research task to complete
---

You are a research assistant with read-only access to the codebase and GitHub.

Your capabilities:
- Search and read files in the repository
- Search GitHub issues and pull requests
- Fetch web documentation

You cannot:
- Edit or create files
- Run terminal commands
- Make commits

When researching, provide citations and links to sources.
```

Now you can ask: *"Use a subagent to find all issues assigned to me about authentication and summarize them"* — and the subagent will be limited to read-only operations.

If you've used Claude Code's subagent system, you'll recognize this pattern—it's similar to how [Claude Code handles skills and subagents](/blog/claude-code-customization-guide-claudemd-skills-subagents) with tool restrictions.

### Control Subagent Availability

Use the `infer` attribute to control whether an agent can be used as a subagent:

```markdown
---
name: dangerous-deployer
description: Handles production deployments
tools: ['execute', 'edit', 'read']
infer: false  # This agent cannot be auto-invoked as a subagent
---
```

---

## Skills Are Now a First-Class Feature

Skills are now **enabled by default** for all users. They're folders containing instructions and resources that Copilot loads on-demand when relevant to your task.

**Related PRs:**
- [Issue #286237 - Custom agent improvements](https://github.com/microsoft/vscode/issues/286237)
- [Issue #286238 - Skill lookup enhancements](https://github.com/microsoft/vscode/issues/286238)
- [PR #3082 - Implement agent using CustomAgentProvider API](https://github.com/microsoft/vscode-copilot-chat/pull/3082)

### Creating Your First Skill

Create a directory structure:

**`SKILL.md`:**
```markdown
---
name: webapp-testing
description: Guide for testing web applications using Playwright.
             Use this when asked to create or run browser-based tests.
---

# Web Application Testing with Playwright

When creating tests for this project, follow these patterns:

## Test Structure
- Use `describe` blocks for feature groupings
- Use `test` for individual test cases
- Always include setup and teardown

## Assertions
- Prefer `toBeVisible()` over `toHaveCount(1)`
- Use `waitFor` for async operations
- Include accessibility checks

## Example Template
Reference the [test template](./test-template.js) for the standard structure.

## Naming Convention
- Test files: `*.spec.ts`
- Test descriptions: "should [expected behavior] when [condition]"
```

Now when you ask *"Write Playwright tests for the login form"*, Copilot automatically loads this skill and follows your project's testing conventions.

### Loading Skills from Custom Locations

For teams sharing skills across repos, use the new setting:

```json
{
  "chat.agentSkillsLocations": [
    ".github/skills",
    "~/shared-skills",
    "/team/copilot-skills"
  ]
}
```

### Extension-Contributed Skills

Extensions can now contribute skills via their `package.json`:

```json
{
  "contributes": {
    "copilotSkills": [
      {
        "name": "docker-compose",
        "description": "Helps create and debug Docker Compose configurations",
        "path": "./skills/docker-compose"
      }
    ]
  }
}
```

Or dynamically via the new API:

```typescript
vscode.chat.registerSkill({
  name: 'dynamic-skill',
  description: 'A skill registered at runtime',
  async getInstructions(context) {
    // Return context-aware instructions
    return generateInstructionsFor(context.workspace);
  }
});
```

---

## Instruction Files Work Everywhere

Instruction files now apply to **non-coding tasks** like code exploration, architecture explanation, and documentation. [#287152](https://github.com/microsoft/vscode/issues/287152)

**Before:** Your `.github/copilot-instructions.md` was ignored when you asked *"Explain how authentication works in this codebase"*

**After:** Those instructions are now read for all codebase-related work.

This aligns with the [progressive disclosure approach](/blog/stop-bloating-your-claude-md-progressive-disclosure-ai-coding-tools) where context is loaded on-demand rather than crammed into a single file.

**Example `copilot-instructions.md`:**
```markdown
# Project Context

This is a microservices architecture with:
- API Gateway (Node.js/Express)
- Auth Service (Go)
- User Service (Python/FastAPI)
- Shared message queue (RabbitMQ)

When explaining code:
- Always mention which service a file belongs to
- Reference the architecture diagram at docs/architecture.md
- Note any cross-service dependencies
```

Now *"How does user registration work?"* will include this context automatically.

---

## Claude Code Gets Extended Thinking

The Claude Code integration now supports **extended thinking**, showing Claude's chain-of-thought reasoning in a collapsible section. [#287658](https://github.com/microsoft/vscode/issues/287658)

**Related:** [Issue #266962 - Claude agent support](https://github.com/microsoft/vscode/issues/266962), [#287933 - Model picker support](https://github.com/microsoft/vscode/issues/287933)

### What It Looks Like

When you ask Claude to solve a complex problem, you'll see:

```
▼ Thinking...
  Let me analyze the codebase structure first. I see there are
  three main modules: auth, api, and database. The user is asking
  about the authentication flow, so I should trace the request
  from the API gateway through to the auth service...

  The JWT validation happens in middleware/auth.ts, but the token
  generation is in services/auth/token.go. I need to explain how
  these connect via the shared Redis cache...

Here's how authentication works in your codebase:
[Final response]
```

### Configuration

Enable/disable thinking display in settings:
```json
{
  "github.copilot.chat.claude.showThinking": true
}
```

### Model Picker

You can now select which Claude model to use:

1. Open the Chat view
2. Click the model selector dropdown
3. Choose from available Claude models (Sonnet, Opus, etc.)

Different models offer different speed/capability tradeoffs—use faster models for simple tasks, more capable models for complex reasoning.

---

## Terminal Gets Major Upgrades

The integrated terminal received significant keyboard handling improvements this release, with two new protocol implementations.

**Related PRs:**
- [PR #286897 - xterm.js 6.1.0 with kitty keyboard and win32-input-mode](https://github.com/microsoft/vscode/pull/286897)
- [Issue #286809 - Kitty keyboard protocol support](https://github.com/microsoft/vscode/issues/286809)
- [Issue #286896 - Win32 input mode support](https://github.com/microsoft/vscode/issues/286896)
- [xterm.js PR #5600 - Implement kitty keyboard protocol](https://github.com/xtermjs/xterm.js/pull/5600) (upstream)

### Kitty Keyboard Protocol (CSI u)

VS Code's terminal now supports the [kitty keyboard protocol](https://sw.kovidgoyal.net/kitty/keyboard-protocol/), enabling more sophisticated keyboard input handling. This unlocks previously unavailable key combinations and provides better support for terminal applications that use this modern standard.

**Important:** This feature is **disabled by default** as it's experimental. Enable it in settings:

```json
{
  "terminal.integrated.enableKittyKeyboardProtocol": true
}
```

The protocol improves handling of modifiers, key events, repeat detection, and escape sequences—particularly useful if you use tools like fish shell, neovim, or other terminal applications that support CSI u.

### Win32 Input Mode

For Windows users, the terminal now supports win32-input-mode, improving keyboard handling compatibility with Windows console applications. VT sequences alone can't send everything that Windows console programs expect (encoded as win32 INPUT_RECORDs), so this mode bridges that gap.

**Also disabled by default.** Enable with:

```json
{
  "terminal.integrated.enableWin32InputMode": true
}
```

### Terminal Command Output Streams Inline

When using Copilot in agent mode, terminal command output now streams inline inside the Chat view instead of requiring you to switch to the terminal panel. [#257468](https://github.com/microsoft/vscode/issues/257468) The output auto-expands on command execution and collapses on success [#287664](https://github.com/microsoft/vscode/issues/287664)—keeping you focused on the conversation flow.

### Terminal Timeout Parameter

The terminal tool now supports a timeout parameter to control how long commands run before timing out. [#286598](https://github.com/microsoft/vscode/issues/286598) This prevents unnecessary polling and gives you more control over long-running operations.

### Terminal Command Sandboxing

Terminal command sandboxing is now available for **macOS and Linux** [#277286](https://github.com/microsoft/vscode/issues/277286), adding an extra layer of security when running commands through the terminal tool.

### Syntax Highlighting in Confirmation Dialogs

The terminal tool now presents Python, Node.js, and Ruby commands with syntax highlighting in the confirmation dialog [#287772](https://github.com/microsoft/vscode/issues/287772), [#287773](https://github.com/microsoft/vscode/issues/287773), [#288360](https://github.com/microsoft/vscode/issues/288360)—making it easier to review commands before execution.

### Expanded Auto-Approved Commands

More commands are now automatically approved for execution:
- `dir` in PowerShell [#288431](https://github.com/microsoft/vscode/issues/288431)
- `sed -i` when editing files within the workspace [#288318](https://github.com/microsoft/vscode/issues/288318)
- `od`, `xxd`, and safe `docker` commands [#287652](https://github.com/microsoft/vscode/issues/287652)

### SGR 221/222 Escape Sequences

The terminal now supports SGR 221 and 222 escape sequences [#286810](https://github.com/microsoft/vscode/issues/286810), allowing independent control of bold and faint text attributes for more granular formatting.

---

## MCP Gets More Powerful

Model Context Protocol continues to evolve with significant new capabilities.

### Dynamic Context Updates

MCP apps now support model context update methods, enabling servers to update the context model dynamically. [#289473](https://github.com/microsoft/vscode/issues/289473) This means MCP servers can push new context to your chat sessions without requiring a refresh.

### Custom Package Registries

Added support for `registryBaseUrl` in MCP packages [#287549](https://github.com/microsoft/vscode/issues/287549), allowing teams to use private package registries for their MCP servers.

### Built-in MCP Apps Support

Built-in support for MCP Apps enables servers to provide custom UI for tool invocation. [#260218](https://github.com/microsoft/vscode/issues/260218) This opens the door for richer, more interactive MCP experiences beyond simple text-based tools.

---

## Quality of Life Improvements

### Codex Agent in Dropdown

The OpenAI Codex agent now appears directly in the agents dropdown [#289040](https://github.com/microsoft/vscode/issues/289040) for quick access:

```
Agents ▼
├── Local Agent
├── Background Agent
├── Cloud Agent
└── Codex Agent       ← New!
```

### New MCP Server Command

A new `workbench.mcp.startServer` command [#283959](https://github.com/microsoft/vscode/issues/283959) lets you programmatically start specific or all MCP servers to discover their tools. This is useful for automation scenarios where you need to ensure servers are running before invoking their tools.

### The `/clear` Command Archives Sessions

The `/clear` command now archives the current session and starts a new one automatically [#285854](https://github.com/microsoft/vscode/issues/285854)—no more losing your chat history when you want a fresh start.

### New Local Chat Command

A new "New Local Chat" command [#288467](https://github.com/microsoft/vscode/issues/288467) lets you start a local chat session quickly.

### Chat Session Imports

You can now **import** a chat session directly into the Chat view [#283954](https://github.com/microsoft/vscode/issues/283954), instead of only being able to open it in a new editor tab. This makes it easier to continue conversations from exported sessions.

### Chat Session Exports with MCP Info

Exported sessions now include [MCP server](/blog/what-is-model-context-protocol-mcp) configuration [#283945](https://github.com/microsoft/vscode/issues/283945):

```json
{
  "session": {
    "messages": [...],
    "mcpServers": [
      {
        "name": "github",
        "url": "https://mcp.github.com",
        "tools": ["search_issues", "get_pr", "list_repos"]
      }
    ]
  }
}
```

This makes sessions reproducible—share them with teammates and they can recreate your exact setup.

### Multi-Select in Sessions View

Select multiple chat sessions with `Cmd/Ctrl+Click` [#288448](https://github.com/microsoft/vscode/issues/288448):
- Archive all selected
- Mark all as read
- Batch delete

Additional session management improvements include "Mark All Read", "Archive All", and "Unarchive All" actions in context menus [#288147](https://github.com/microsoft/vscode/issues/288147), and increased locally persisted chat sessions [#283123](https://github.com/microsoft/vscode/issues/283123).

### Resizable Sessions Sidebar

You can now resize the sessions sidebar in the Chat view by dragging the separator [#281258](https://github.com/microsoft/vscode/issues/281258), similar to how terminal tabs work.

### Extension Context Tooltips

Hover over extension-contributed context items to see additional information about what they provide. [#280658](https://github.com/microsoft/vscode/issues/280658)

### Accessible View Streams Thinking Content

The Accessible View now dynamically streams thinking content [#289223](https://github.com/microsoft/vscode/issues/289223), making Claude's chain-of-thought reasoning accessible to screen reader users in real-time.

### Multi-Model Selection in Language Models Editor

Select multiple models in the Language Models editor and toggle their visibility at once [#287511](https://github.com/microsoft/vscode/issues/287511). Enterprise and Business users also get access to the Manage Models action [#287814](https://github.com/microsoft/vscode/issues/287814).

---

## Editor & Language Improvements

### Improved Shebang Detection

VS Code now recognizes Deno, Bun, and other modern JavaScript runtimes [#287819](https://github.com/microsoft/vscode/issues/287819) for better language detection when opening scripts.

### Better Ghost Text Visibility

Improved visibility of ghost text in next edit suggestions [#284517](https://github.com/microsoft/vscode/issues/284517), making it easier to distinguish AI suggestions from regular text.

### Double-Click Selects Block Content

Double-clicking immediately after a curly brace or bracket now selects the content inside it [#9123](https://github.com/microsoft/vscode/issues/9123)—a small but impactful change for manipulating code blocks.

### Match File Path Case Toggle

A new "Match File Path Case" toggle in the Search view's "files to include" input [#10633](https://github.com/microsoft/vscode/issues/10633) lets you control whether file paths and glob patterns match case-sensitively.

### Bracket Match Foreground Color

New `editorBracketMatch.foreground` theme color [#85775](https://github.com/microsoft/vscode/issues/85775) enables customization of matched bracket text color.

### Parallel Build Tasks

Dependent build tasks can now run in parallel [#288439](https://github.com/microsoft/vscode/issues/288439), improving build performance for projects with multiple independent compilation steps.

### Git Delete File Command

A new "Git: Delete File" command [#111767](https://github.com/microsoft/vscode/issues/111767) performs `git rm` on the current file directly from the command palette.

---

## Try It Today

Here's a quick workflow to test the new features:

1. **Create a custom agent** at `.github/agents/researcher.md` with restricted tools
2. **Create a skill** at `.github/skills/my-skill/SKILL.md`
3. **Ask Copilot:** *"What skills and subagents do you have available?"*
4. **Test parallel execution:** *"Use subagents to research three different topics simultaneously"*
5. **Enable Claude thinking** and ask a complex architecture question

---

## Looking Ahead

These updates signal a clear direction: Copilot is evolving from a single-agent assistant into a **coordinated multi-agent system**. The combination of parallel subagents, constrained tool access, and shareable skills creates a foundation for sophisticated automated workflows.

If you're interested in building your own agent systems, check out [Building Your Own Coding Agent from Scratch](/blog/building-your-own-coding-agent-from-scratch) for a hands-on guide to the underlying patterns.

Key settings to know:
```json
{
  "chat.useAgentSkills": true,
  "chat.agentSkillsLocations": [".github/skills"],
  "chat.customAgentInSubagent.enabled": true,
  "github.copilot.chat.claude.showThinking": true,
  "terminal.integrated.enableKittyKeyboardProtocol": true,
  "terminal.integrated.enableWin32InputMode": true
}
```

The ecosystem is about to get a lot more interesting.

---

## Related Pull Requests & Issues

For those who want to dig into the implementation details:

### Agent & Skills
- [#274630 - Parallel subagent execution](https://github.com/microsoft/vscode/issues/274630)
- [#280704 - Agents define allowed subagents](https://github.com/microsoft/vscode/issues/280704)
- [#288480 - Skills enabled by default](https://github.com/microsoft/vscode/issues/288480)
- [#288483 - Extension-contributed skills via manifest](https://github.com/microsoft/vscode/issues/288483)
- [#288486 - Dynamic skills API](https://github.com/microsoft/vscode/issues/288486)
- [#282738 - Skills from custom locations](https://github.com/microsoft/vscode/issues/282738)

### Claude Integration
- [#287658 - Extended thinking support](https://github.com/microsoft/vscode/issues/287658)
- [#287933 - Model picker for Claude](https://github.com/microsoft/vscode/issues/287933)
- [#266962 - Claude agent support](https://github.com/microsoft/vscode/issues/266962)

### Terminal
- [#286809 - Kitty keyboard protocol](https://github.com/microsoft/vscode/issues/286809)
- [#286896 - Win32 input mode](https://github.com/microsoft/vscode/issues/286896)
- [#286810 - SGR 221/222 escape sequences](https://github.com/microsoft/vscode/issues/286810)
- [#257468 - Terminal output streams inline](https://github.com/microsoft/vscode/issues/257468)
- [#287664 - Auto-expand/collapse terminal output](https://github.com/microsoft/vscode/issues/287664)
- [#277286 - Terminal sandboxing for macOS/Linux](https://github.com/microsoft/vscode/issues/277286)
- [#286598 - Terminal timeout parameter](https://github.com/microsoft/vscode/issues/286598)
- [#287772 - Python syntax highlighting in confirmations](https://github.com/microsoft/vscode/issues/287772)
- [xterm.js #5600 - Kitty keyboard protocol](https://github.com/xtermjs/xterm.js/pull/5600)

### MCP
- [#289473 - Dynamic context updates](https://github.com/microsoft/vscode/issues/289473)
- [#287549 - Custom package registries](https://github.com/microsoft/vscode/issues/287549)
- [#260218 - Built-in MCP Apps](https://github.com/microsoft/vscode/issues/260218)
- [#283959 - startServer command](https://github.com/microsoft/vscode/issues/283959)
- [#283945 - MCP info in session exports](https://github.com/microsoft/vscode/issues/283945)

### Chat & Sessions
- [#285854 - /clear archives sessions](https://github.com/microsoft/vscode/issues/285854)
- [#288467 - New Local Chat command](https://github.com/microsoft/vscode/issues/288467)
- [#283954 - Import chat sessions](https://github.com/microsoft/vscode/issues/283954)
- [#288448 - Multi-select in sessions](https://github.com/microsoft/vscode/issues/288448)
- [#281258 - Resizable sessions sidebar](https://github.com/microsoft/vscode/issues/281258)
- [#283123 - Increased persisted sessions](https://github.com/microsoft/vscode/issues/283123)
- [#289223 - Accessible View streams thinking](https://github.com/microsoft/vscode/issues/289223)

### Editor & Other
- [#287819 - Improved shebang detection](https://github.com/microsoft/vscode/issues/287819)
- [#284517 - Ghost text visibility](https://github.com/microsoft/vscode/issues/284517)
- [#9123 - Double-click selects block content](https://github.com/microsoft/vscode/issues/9123)
- [#10633 - Match file path case toggle](https://github.com/microsoft/vscode/issues/10633)
- [#288439 - Parallel build tasks](https://github.com/microsoft/vscode/issues/288439)
- [#111767 - Git Delete File command](https://github.com/microsoft/vscode/issues/111767)

### Iteration Plan
- [#286040 - January 2026 Iteration Plan](https://github.com/microsoft/vscode/issues/286040)

---

*These features are rolling out in VS Code Insiders (1.109) now, with stable release expected in early February. Note that some features like kitty keyboard protocol and win32-input-mode are disabled by default and require manual opt-in.*
