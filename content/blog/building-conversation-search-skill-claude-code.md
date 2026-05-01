---
author: Alexander Opalic
pubDatetime: 2026-01-17T00:00:00Z
title: "How I Built a Skill That Lets Me Talk to Claude's Conversation Memory"
description: "How I built a skill that lets Claude search its own conversation history, turning it into a persistent coding partner that remembers past solutions."
tags: ["claude-code", "ai", "tooling", "python"]
draft: false
---

When I work with Claude Code on complex projects, I often remember discussing a problem or solution but can't find it. "We fixed that EMFILE error last week, what was the solution?" or "What did we work on yesterday?"

Claude Code stores every session locally. But Claude itself can't search those files by default. So I built a skill that lets Claude search its own conversation history.

This turns Claude into a persistent coding partner that actually remembers past solutions.

> 
If you're not familiar with how skills work in Claude Code, check out my [guide to CLAUDE.md, skills, and subagents](/blog/claude-code-customization-guide-claudemd-skills-subagents) first.

> 
If you just want to check out the skill, find it here: [conversation-search skill](https://github.com/alexanderop/dotfiles/tree/main/claude/skills/conversation-search)

## How Claude Code Stores Conversations

Every Claude Code session gets saved as a JSONL file in `~/.claude/projects/`. The directory structure looks like this:

The path encoding is simple: replace `/` with `-` and prefix absolute paths with `-`. So `/Users/alex/Projects/myapp` becomes `-Users-alex-Projects-myapp`.

Each JSONL file contains one JSON object per line:

```json
{"type": "user", "timestamp": "2026-01-16T10:30:00Z", "gitBranch": "main", "message": {"content": "Fix the EMFILE error"}}
{"type": "assistant", "timestamp": "2026-01-16T10:30:15Z", "message": {"content": [{"type": "text", "text": "Let me investigate..."}, {"type": "tool_use", "name": "Bash", "input": {"command": "ulimit -n"}}]}}
{"type": "summary", "summary": "Fixed EMFILE error by increasing file descriptor limit"}
```

Each entry includes the role, timestamp, git branch, message content, and tool uses. The `summary` type appears when Claude generates a conversation summary.

## The Skill Structure

The skill lives in `~/.claude/skills/conversation-search/` with two files:

The `SKILL.md` file tells Claude when to activate this skill:

```yaml
---
name: conversation-search
description: Search past Claude Code conversation history. Use when asked to recall,
  find, or search for anything from previous conversations. Triggers include
  "what did we do today", "how did we fix X", "search history", "recall when we"...
---
```

When I ask "what did we do yesterday?", Claude recognizes the trigger and knows to use this skill.

## How the Python Script Works

The script has two modes: **digest** for daily summaries and **search** for finding specific solutions.

### Data Structures

The script parses JSONL files into clean dataclasses:

```python
@dataclass
class Message:
    uuid: str
    parent_uuid: Optional[str]
    role: str  # 'user', 'assistant'
    content: str
    timestamp: str
    tool_uses: list
    tool_results: list

@dataclass
class Conversation:
    session_id: str
    file_path: str
    summary: Optional[str]
    messages: list
    project_path: str
    git_branch: Optional[str]
    timestamp: str

@dataclass
class SearchResult:
    conversation: Conversation
    score: float
    matched_messages: list
    problem_excerpt: str
    solution_excerpt: str
    commands_run: list
```

### Relevance Scoring

The search algorithm tokenizes the query and content, then calculates relevance scores with weighted boosts:

```python
def calculate_relevance_score(query: str, conversation: Conversation) -> tuple:
    query_tokens = tokenize(query)
    total_score = 0.0
    matched_messages = []

    # Summary gets highest weight (3x)
    if conversation.summary:
        summary_tokens = tokenize(conversation.summary)
        summary_overlap = len(query_tokens & summary_tokens) / len(query_tokens)
        total_score += summary_overlap * 3.0

    # Check each message
    for msg in conversation.messages:
        msg_tokens = tokenize(msg.content)
        overlap = len(query_tokens & msg_tokens)

        if overlap > 0:
            msg_score = overlap / len(query_tokens)

            # User messages get 1.5x boost (problem descriptions)
            if msg.role == 'user':
                msg_score *= 1.5

            # Messages with tool uses get 1.3x boost (solutions)
            if msg.tool_uses:
                msg_score *= 1.3

            total_score += msg_score
            matched_messages.append(msg)

    return total_score, matched_messages
```

The weighting makes sense: summaries are the most relevant since they capture the essence. User messages describe problems. Tool uses indicate actual solutions.

### Date Filtering

The script supports filtering by date range:

```bash
# Today's sessions only
python3 search_history.py --today "newsletter"

# Yesterday
python3 search_history.py --yesterday "bug fix"

# Last 7 days
python3 search_history.py --days 7 "refactor"

# Since a specific date
python3 search_history.py --since 2026-01-01 "feature"
```

### Extracting Useful Information

The script extracts practical information from each conversation:

```python
def extract_bash_commands(conversation: Conversation) -> list:
    """Extract Bash commands run during the conversation."""
    commands = []
    for msg in conversation.messages:
        for tool in msg.tool_uses:
            if tool.get('name') == 'Bash':
                cmd = tool.get('input', {}).get('command', '')
                if cmd:
                    commands.append(cmd)
    return commands

def extract_files_touched(conversation: Conversation) -> list:
    """Extract files that were read, written, or edited."""
    files = set()
    for msg in conversation.messages:
        for tool in msg.tool_uses:
            name = tool.get('name', '')
            inp = tool.get('input', {})

            if name in ('Read', 'Write', 'Edit'):
                path = inp.get('file_path', '')
                if path:
                    files.add(Path(path).name)
    return sorted(files)[:10]
```

This is useful for recreating solutions. If you found how you fixed something before, you can see exactly which commands you ran and which files you changed.

## Using the Skill

### Daily Digest

Ask "what did we do yesterday?" and Claude runs the digest mode:

```bash
python3 search_history.py --digest yesterday
```

Output:

```
## January 16, 2026 - 32 sessions

### 1. Set Context Menu Feature Spec
   Session: `1498ff91`
   Branch: `fitnessFunctions`
   Files: set-context-menu.md, SetContextMenu.vue, SetContextMenuPO.ts
   Commands: 12 executed

### 2. Fix Pipeline: Missing i18n, Unused Exports
   Session: `23351e77`
   Branch: `fitnessFunctions`
   Files: de.json, en.json, claude-qa.yml
   Commands: 6 executed

### 3. Adding AI Coding Articles to Second Brain
   Session: `5c909423`
   Branch: `main`
   Files: article.md, dex-horthy.md, diagrams-guide.md
   Commands: 1 executed
```

This is great for standup notes or just remembering what you worked on.

### Keyword Search

Ask "how did we fix the EMFILE error?" and Claude searches for relevant sessions:

```bash
python3 search_history.py "EMFILE error" --days 14
```

Output:

```
============================================================
Result #1 (Score: 4.25)
============================================================
Project: /Users/alex/Projects/fitness-app
Session: a1b2c3d4...
Branch: main
Date: 2026-01-10

PROBLEM:
Getting EMFILE error when running tests, too many open files

SOLUTION:
The issue was too many file watchers. Fixed by increasing the limit with
`ulimit -n 10240` and adding it to shell profile...

COMMANDS RUN (3 total):
  $ ulimit -n
  $ ulimit -n 10240
  $ echo "ulimit -n 10240" >> ~/.zshrc
```

Now I can recreate the exact solution without remembering the details.

### Project Filtering

You can narrow searches to a specific project:

```bash
python3 search_history.py "vitest config" --project ~/Projects/fitness-app
```

## Why This Matters

Before this skill, I'd waste time re-solving problems I'd already solved. "I know we discussed this, but I can't find it." Now I just ask Claude.

The benefits:

1. **No more re-solving problems** - Claude finds past solutions instantly
2. **Daily digests for standups** - "What did we work on yesterday?" gives a ready summary
3. **Commands are preserved** - You can recreate exact solutions with the same commands
4. **Cross-project search** - Find solutions from any project you've worked on

The skill turns Claude from a stateless assistant into something closer to a persistent coding partner. It remembers what you've done together.

> 
If you want to extend Claude Code with custom skills, check out my post on [building a Claude Code plugin](/blog/building-my-first-claude-code-plugin) for packaging and sharing skills across projects.

