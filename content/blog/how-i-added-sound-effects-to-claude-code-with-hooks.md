---
author: Alexander Opalic
pubDatetime: 2026-02-11T00:00:00Z
title: "How I Added Sound Effects to Claude Code with Hooks"
slug: how-i-added-sound-effects-to-claude-code-with-hooks
description: "Claude Code hooks let you run shell commands on lifecycle events. I wired up Age of Empires sound effects to session start, prompt submission, task completion, and context compaction."
tags: ["claude-code", "hooks", "tooling"]
draft: false
---

## TLDR

Claude Code has a hooks system that lets you run shell commands on lifecycle events. I wired up Age of Empires sound effects to four key moments: session start, prompt submission, task completion, and context compaction. Now my terminal sounds like a medieval battlefield and I love it.

## Why Sounds?

I spend a lot of time in Claude Code. Sometimes I send a prompt and switch to another window while it works. The problem is I never know when it's done. I could keep checking, but that breaks my flow.

I wanted audio cues. Something that tells me "hey, I'm done" without me having to look. And if I'm going to add sounds, why not make them fun?

## How Claude Code Hooks Work

Claude Code lets you define hooks in your `settings.json` file at `~/.claude/settings.json`. Hooks fire on specific lifecycle events:

- **SessionStart**: When a new Claude Code session begins
- **UserPromptSubmit**: Right after you hit enter on a prompt
- **Stop**: When Claude finishes its response
- **PreCompact**: Before context compaction happens (when the conversation gets too long)

Each hook runs a shell command. That's it. Simple and powerful.

If you're new to hooks, I covered the basics in my post about [setting up Claude Code notification hooks](/blog/claude-code-notification-hooks). This post goes in a different direction: instead of desktop notifications, we're adding sound effects.

For a broader look at what Claude Code can do, see my [overview of the full Claude Code feature stack](/blog/understanding-claude-code-full-stack).

## My Setup

I put four MP3 files in `~/.claude/sounds/` and used `afplay` (macOS built-in audio player) to play them. Here's my full hooks config:

```json
// ~/.claude/settings.json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear",
        "hooks": [
          {
            "type": "command",
            "command": "afplay ~/.claude/sounds/horn.mp3 &"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "afplay ~/.claude/sounds/yes.mp3 &"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "afplay ~/.claude/sounds/allhail.mp3 &"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "afplay ~/.claude/sounds/wololo.mp3 &"
          }
        ]
      }
    ]
  }
}
```

The `&` at the end is important. It runs `afplay` in the background so the sound doesn't block Claude Code from continuing.

## The Sound Choices

All sounds are from Age of Empires. Here's why I picked each one:

| Event | Sound | Why |
|-------|-------|-----|
| SessionStart | `horn.mp3` | A battle horn. The session begins, time to work. |
| UserPromptSubmit | `yes.mp3` | The villager "yes" response. Claude acknowledges your command. |
| Stop | `allhail.mp3` | "All hail!" when Claude finishes. Victory. |
| PreCompact | `wololo.mp3` | The priest conversion sound. Your context is being... converted. |

The `wololo` for context compaction is my favorite. If you've played Age of Empires, you know what happens when a priest starts chanting "wololo": things change. That's exactly what context compaction does. It transforms your conversation to fit the context window.

## Bonus: Touch Files for Status Line

You might have noticed my actual config also touches files like `touch ~/.claude/.claude-done`. I use these as signals for my [custom status line script](/blog/customize_claude_code_status_line). The status line reads these files to show the current Claude Code state in my terminal prompt.

## How to Set This Up Yourself

1. Create the sounds directory: `mkdir -p ~/.claude/sounds`
2. Drop your MP3 files in there (any short sound clips work)
3. Add the hooks config to `~/.claude/settings.json`
4. Restart Claude Code

> 
On Linux, replace `afplay` with `aplay` or `paplay`. On Windows WSL, you can use `powershell.exe -c (New-Object Media.SoundPlayer "path").PlaySync()`.

## Conclusion

- Claude Code hooks run shell commands on lifecycle events
- You can use `afplay` on macOS to play sounds in the background
- Age of Empires sounds make the terminal more fun
- The `&` suffix is key so sounds don't block execution
- Touch files can signal other tools like status line scripts

Small things like audio feedback make tools feel more alive. It took five minutes to set up and now I actually enjoy waiting for Claude to finish.
