---
author: Alexander Opalic
pubDatetime: 2026-02-06T00:00:00Z
title: "7 Agent Team Patterns for Claude Code"
description: "Agent teams let multiple Claude Code instances work in parallel. But when should you use them — and how should you structure the team? Here are 7 patterns I keep reaching for."
tags: ["claude-code", "ai", "tooling", "productivity"]
draft: true
---

Anthropic just shipped agent teams in Claude Code. Instead of one AI session doing everything sequentially, you can now spin up multiple Claude Code instances that work in parallel — each with its own context window, communicating through a shared task list and direct messaging.

I've been using this on my [presenter view redesign](/blog/claude-code-agent-teams-real-world-example) and across several other projects. After a few weeks of experimenting, I've noticed the same patterns keep showing up.

This post documents **7 patterns** that work well with agent teams, when to use each one, and the actual prompts that trigger them. If you've been wondering whether agent teams are worth the token cost — or how to structure them when you do reach for them — this should help.

## Table of Contents

## Quick Primer: What Are Agent Teams?

If you've used [subagents](/blog/claude-code-customization-guide-claudemd-skills-subagents) before, agent teams are the next level up. Subagents run inside your session and can only report results back to you. Agent teams are fully independent Claude Code instances that can message each other, claim tasks from a shared list, and coordinate without going through the lead.

| | Subagents | Agent Teams |
|:--|:----------|:------------|
| **Context** | Shares parent session | Own context window |
| **Communication** | Reports back to caller | Messages anyone on the team |
| **Coordination** | Parent manages everything | Shared task list with self-organization |
| **Token cost** | Lower | Higher (each teammate is a full session) |

Enable them by adding this to your `settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Then just describe the team you want in natural language. Claude handles spawning, task creation, and coordination.

> 
Agent teams are still experimental. They work best when teammates can operate independently on different files. For sequential work or same-file edits, a single session is more effective.

## The Decision Tree

Before jumping into patterns, here's how I decide what to use:

The key question is whether teammates need to **communicate with each other** — not just report back to you. If agent A's findings should influence agent B's approach, you want a team. If you just need results collected, subagents are cheaper and simpler.

## Pattern 1: The Review Board

**Multiple reviewers examine the same code through different lenses simultaneously.**

This is the most straightforward pattern and a great starting point if you're new to agent teams. Each reviewer focuses on one dimension of quality, and the lead synthesizes findings at the end.

### When to use it

- PR reviews before merging
- Security audits of new features
- Pre-release quality checks
- Architecture reviews

### The prompt

Create a team to review the changes on this branch. Spawn three reviewers:
- Security: check for injection risks, auth bypass, input validation gaps
- Performance: look for N+1 queries, unnecessary re-renders, bundle size impact
- Test coverage: find edge cases without assertions, missing error paths, flaky patterns
Have each reviewer work independently and report findings.

### Why it works

A single reviewer anchors on whatever category of issue it finds first. If it spots a SQL injection risk in the first file, it starts looking for more injection risks everywhere — and misses the performance regression in a completely different file.

Three parallel reviewers with assigned lenses guarantee coverage across dimensions. The lead then synthesizes findings and can flag conflicts — like a performance optimization that introduces a security risk.

> 
If you've never used agent teams before, start with this pattern. The work is read-only, the tasks are independent, and there's zero risk of file conflicts.

## Pattern 2: The Hypothesis Race

**Multiple teammates investigate competing theories about a bug. They actively try to disprove each other.**

This is the "killer use case" for agent teams. Sequential debugging suffers from anchoring bias — once you find one plausible explanation, you stop looking. The Hypothesis Race fights this by making investigation adversarial.

### When to use it

- Intermittent production bugs
- "It works on my machine" problems
- Performance regressions with unclear cause
- Any bug where the root cause isn't obvious

### The prompt

Users report the checkout flow drops cart items after page refresh.
Spawn 4 teammates to investigate competing hypotheses:
1. Session storage is being cleared prematurely
2. Cart state isn't syncing to the backend before navigation
3. Race condition between hydration and cart restore
4. Service worker cache is serving stale state
Have them challenge each other's findings like a scientific debate.
Update a shared findings doc with whatever consensus emerges.

### Why it works

When one agent investigates sequentially, it finds the first plausible explanation and stops. With four agents each championing a different theory and actively trying to disprove each other, the theory that survives is much more likely to be the actual root cause.

The key mechanism is the **debate structure**. Telling agents to "challenge each other" means they're not just passively investigating — they're looking for evidence that contradicts the other theories. This is something a single session fundamentally can't do because it would have to argue against its own conclusions.

> 
3-5 hypotheses is the sweet spot. Fewer than 3 and you don't get enough diversity. More than 5 and the coordination overhead and token cost outweigh the benefit.

## Pattern 3: The Layer Cake

**Each teammate owns a different layer of the stack. They build in parallel with task dependencies coordinating the flow.**

This is the pattern for new features that touch types, API, UI, and tests. Instead of one session context-switching between layers (and losing focus), each teammate stays deep in their domain.

### When to use it

- Full-stack feature additions
- Features spanning schema, API, frontend, and tests
- Anything that needs types defined before implementation starts

### The prompt

We're adding user notification preferences. Create a team:
- Schema: Zod schemas, TypeScript types, DB migration
- API: REST endpoints, validation, business logic
- UI: Settings page component, form handling, optimistic updates
- Tests: Unit tests for API, integration tests for UI

Schema should finish first since the others depend on it.
Each teammate owns their own files — no overlapping.

### Why it works

The task dependency system is the coordination mechanism. When you tell Claude that the schema work blocks the others, it creates `blockedBy` relationships in the task list. The API and UI teammates automatically start once the schema teammate finishes. No manual handoff needed.

The critical rule: **each teammate must own different files**. Two teammates editing the same file leads to overwrites. Break work along file boundaries, not logical boundaries.

> 
This pattern fails if teammates touch the same files. Always assign clear file ownership when multiple agents are writing code. If two layers need to modify a shared file, have one teammate own it and the other request changes via messages.

## Pattern 4: The Migration Swarm

**Self-organizing workers grab files from a shared pool and apply the same mechanical transformation. No inter-agent communication needed.**

This is the highest-throughput pattern. It's pure parallelism — four workers means roughly 4x the speed for mechanical transforms. Workers don't need to talk to each other; they just pick up the next unclaimed file and go.

### When to use it

- Codemod-style API migrations across many files
- Lint rule fixes (e.g., fixing 40 `no-let-in-describe` violations)
- Dependency upgrade patterns (old API to new API)
- Renaming patterns across a codebase

### The prompt

We need to migrate 35 test files from the old assertion API
(expect.element().toBeVisible) to the new one (await expect(locator).toBeVisible).

Create a team with 4 workers. Each should:
1. Check the task list for the next unclaimed test file
2. Apply the migration pattern
3. Run that specific test to verify it passes
4. Mark the task complete and grab the next one

### Why it works

This is the simplest coordination model: a shared task list where workers self-claim. No messages, no dependencies, no debate. Each worker grabs a file, transforms it, verifies it, and moves on.

The task list's file-locking prevents race conditions — two workers can't accidentally claim the same file. And because each worker only touches one file at a time, there are no merge conflicts.

If the transformation is purely syntactic (rename a function, change import paths), a proper codemod tool like `jscodeshift` is faster and cheaper. Use the Migration Swarm when:

- The transformation requires understanding context (e.g., "change the assertion but only if it's inside an async test")
- Each file needs slightly different handling
- You also need to run tests per-file to verify
- The migration involves judgment calls, not just find-and-replace

## Pattern 5: The Spike Squad

**2-3 teammates each prototype a different approach to the same problem. The lead compares working code, not theoretical pros/cons lists.**

Architecture decisions are hard to make from theory alone. The Spike Squad gives you actual implementations to compare — not just bullet-point trade-off lists, but working code you can evaluate.

### When to use it

- "Which library should we use?" decisions
- Performance optimization with multiple strategies
- Architecture choices (WebSockets vs. SSE vs. polling)
- Any decision where seeing working code beats reading docs

### The prompt

We need real-time updates for the dashboard. Spawn 3 teammates:
- Teammate A: Prototype with WebSockets using socket.io
- Teammate B: Prototype with Server-Sent Events
- Teammate C: Prototype with polling and SWR-style caching

Each should build a minimal working version in a separate directory
(spikes/websocket, spikes/sse, spikes/polling) and document:
- Bundle size impact
- Reconnection handling complexity
- How many lines of code
- Any gotchas they discovered

### Why it works

A single session researching three approaches will inevitably spend most of its context on whichever approach it investigates first — and by the time it gets to the third option, it's already biased. Three teammates each championing their own approach gives you honest implementations.

The lead's job at the end is synthesis: reading all three reports, comparing the actual code, and recommending one approach. Because the lead didn't build any of them, it can evaluate more objectively.

> 
Always put spikes in separate directories. This prevents file conflicts and makes it easy to `diff` the approaches afterward. Clean up the losing spikes after you decide.

## Pattern 6: The Generator-Critic

**One teammate builds. Another teammate tries to break it. They iterate until the critic can't find more issues.**

This is the adversarial pair pattern. The generator and critic have opposing incentives: the generator wants to ship clean code, the critic wants to find every possible edge case. This tension produces more robust code than a single session that both writes and reviews its own work.

### When to use it

- Security-sensitive features (auth, permissions, payment)
- Complex business logic with many edge cases
- Anything where correctness matters more than speed
- Code that handles untrusted input

### The prompt

We're implementing role-based access control. Create a team with two agents:

- Builder: Implement the RBAC permission checker based on the spec in docs/rbac-spec.md
- Critic: Write adversarial test cases trying to find permission escalation bugs,
  edge cases with nested roles, and race conditions.
  Challenge the builder's implementation directly.

Require plan approval for the critic so I can review their
attack vectors before they test.

### Why it works

The same session that writes code has blind spots when testing it. It knows what the code is supposed to do, so it unconsciously writes tests that confirm the happy path. A separate critic with fresh context — and explicit instructions to find problems — catches things the builder assumes are correct.

The plan approval requirement for the critic is important. You want to review the attack vectors before they run. This gives you visibility into what the critic is testing and lets you steer it toward the risks you care about most.

For security-critical code, you can extend this to a 3-person team:

- **Builder**: Implements the feature
- **Red Team**: Actively tries to exploit it (injection, bypass, escalation)
- **Blue Team**: Reviews the red team's findings and fixes vulnerabilities

The red and blue teams communicate directly, creating a rapid attack-defend cycle while the builder focuses on feature completeness.

## Pattern 7: The Research Council

**Multiple teammates research a topic from assigned perspectives, then debate before the lead synthesizes a recommendation.**

This is for decisions where you need depth, not breadth. Instead of one balanced (but shallow) analysis, you get advocates who are forced to go deep on their assigned perspective.

### When to use it

- Technology selection (migrate to tRPC? adopt a new framework?)
- "Should we rewrite X?" decisions
- RFC drafting
- Evaluating competing approaches to a hard problem

### The prompt

We're evaluating whether to migrate from REST to tRPC.
Create a team with 3 perspectives:

- Advocate: Research all benefits — DX improvements, type safety,
  successful migrations, bundle size wins
- Skeptic: Research all risks — ecosystem gaps, failed migrations,
  learning curve, vendor lock-in
- Pragmatist: Look at our actual codebase (src/api/) and estimate
  the real migration effort in weeks

Have them share findings and challenge each other before I decide.

### Why it works

A single session asked to "evaluate tRPC" will produce a balanced-sounding analysis that's actually shallow. It'll list a few pros, a few cons, and recommend "it depends."

Assigned roles force depth. The advocate finds benefits a balanced reviewer would dismiss as minor. The skeptic finds risks they'd gloss over. The pragmatist grounds the debate in your actual codebase instead of theoretical arguments.

The debate phase is what makes this a team pattern rather than just three subagents. When the advocate claims "type safety eliminates a whole class of bugs," the skeptic can respond with "but 80% of your endpoints return `any` from third-party APIs, so you'd just be wrapping untyped data in typed wrappers." That back-and-forth produces better recommendations than three independent reports.

## Quick Reference

| Pattern | Best For | Team Size | Communication Style |
|:--------|:---------|:----------|:-------------------|
| **Review Board** | Code review, audits | 3-4 | Report to lead |
| **Hypothesis Race** | Debugging, incidents | 3-5 | Debate each other |
| **Layer Cake** | Full-stack features | 3-4 | Task dependencies |
| **Migration Swarm** | Bulk transforms | 3-5 | Self-organizing, no talk |
| **Spike Squad** | Architecture decisions | 2-3 | Report to lead |
| **Generator-Critic** | Security, correctness | 2 | Adversarial back-and-forth |
| **Research Council** | Tech evaluation, RFCs | 3 | Structured debate |

## Practical Tips

A few things I've learned from using these patterns across projects:

### Give teammates enough context

Teammates don't inherit the lead's conversation history. They load your `CLAUDE.md` and project context, but they don't know what you discussed before spawning them. Include task-specific details in the spawn prompt — what to look at, what to focus on, what format to report in.

### Size tasks for 5-15 minutes of work

Too small and the coordination overhead exceeds the benefit. Too large and teammates work too long without check-ins. A good task produces a clear deliverable: a review report, a migrated file, a working prototype.

Having 5-6 tasks per teammate keeps everyone productive and gives the lead opportunities to redirect if something goes off track.

### Watch for the lead implementing

Sometimes the lead starts coding instead of waiting for teammates. If you notice this, tell it:

Wait for your teammates to complete their tasks before proceeding.

Or use **delegate mode** (press `Shift+Tab`) to restrict the lead to coordination-only tools.

### Start read-only, then graduate to writes

The Review Board and Research Council are read-only patterns — no file conflict risk, no merge issues. Start there. Once you're comfortable with the coordination model, move to patterns where teammates write code (Layer Cake, Migration Swarm).

### Use plan approval for risky work

For any pattern where teammates write code, consider requiring plan approval:

Require plan approval for all teammates before they make changes.

The lead reviews each plan and either approves or rejects with feedback. This adds a checkpoint before any code gets written.

### Monitor token usage

Each teammate is a full Claude Code session. A 4-person team uses roughly 4x the tokens of a single session. The patterns where this is most justified:

- **Hypothesis Race**: finding the right root cause faster saves hours of debugging
- **Migration Swarm**: 4x throughput on mechanical work
- **Spike Squad**: getting three working prototypes instead of one theoretical analysis

The patterns where subagents might be enough:

- **Review Board**: if reviewers don't need to challenge each other, subagents that report back work fine
- **Research Council**: if you just want three reports without the debate phase

## Conclusion

- Agent teams work best when teammates can operate **independently on different files** and benefit from **communication with each other**
- Start with read-only patterns (**Review Board**, **Research Council**) before graduating to write patterns (**Layer Cake**, **Migration Swarm**)
- The **Hypothesis Race** is the strongest unique advantage over subagents — adversarial debate between agents produces better debugging outcomes than sequential investigation
- Always assign **clear file ownership** when multiple teammates write code
- Use **task dependencies** to coordinate work flow without manual handoffs
- Token cost scales linearly with team size — make sure the parallel exploration genuinely adds value over a single session
- When in doubt, ask yourself: "Do the workers need to talk to each other?" If yes, use a team. If they just report back, subagents are cheaper
