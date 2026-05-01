---
author: Alexander Opalic
pubDatetime: 2026-02-12T00:00:00Z
title: "How I Turned Claude Code's Thinking Indicator into a One Piece Adventure"
description: "Replace Claude Code's default spinner verbs with custom One Piece references using the spinnerVerbs config in settings.json."
tags: ["ai", "tooling"]
draft: false
---

Every time Claude Code processes a request, it shows a spinner with a verb like "Considering..." or "Analyzing...". That gets old fast. So I replaced all of them with One Piece references.

> 
  You can just ask Claude Code to change the spinner verbs for you. Tell it which theme you want (Star Wars, cooking, etc.) and it'll update `~/.claude/settings.json` directly. This post shows you how it works under the hood.

## The Setting: `spinnerVerbs`

Claude Code exposes a `spinnerVerbs` config in `~/.claude/settings.json`. You set a mode and pass an array of strings. That's it.

```json
{
  "spinnerVerbs": {
    "mode": "replace",
    "verbs": [
      "Stretching like Luffy...",
      "Reading the Poneglyph...",
      "Activating Gear Fifth...",
      "Three-Sword Styling..."
    ]
  }
}
```

## Two Modes

- **`replace`** swaps out every default verb. Claude Code only cycles through your list.
- **`append`** mixes your verbs with the built-in ones.

I picked `replace` because I want full One Piece immersion, no "Considering..." sneaking in.

## My Full Verb List

I wrote 25 verbs that cover the Straw Hat crew and the broader world:

```json
[
  "Stretching like Luffy...",
  "Setting sail on the Grand Line...",
  "Reading the Poneglyph...",
  "Activating Gear Fifth...",
  "Searching for the One Piece...",
  "Navigating with Nami...",
  "Three-Sword Styling...",
  "Cooking with Sanji...",
  "Consulting Nico Robin...",
  "Upgrading with Franky...",
  "Playing Brook's violin...",
  "Haki awakening...",
  "Dodging a Buster Call...",
  "Entering the New World...",
  "Deciphering the Will of D...",
  "Gathering the crew...",
  "Unfurling the Jolly Roger...",
  "Bounty hunting...",
  "Conquering the Calm Belt...",
  "Dreaming of All Blue...",
  "Mapping the world with Nami...",
  "Yohoho-ing with Brook...",
  "Tanuki-ing with Chopper...",
  "Observing with Haki...",
  "Sailing the Thousand Sunny..."
]
```

Each verb references a character, location, or concept from the series. Chopper gets called a tanuki (he hates that), Sanji dreams of All Blue, and Brook does his signature laugh.

## How to Apply It

1. Open `~/.claude/settings.json`.
2. Add the `spinnerVerbs` block anywhere at the top level.
3. Restart Claude Code.

Now every thinking phase picks a random verb from your list. Simple customization, big personality boost.

If you're looking for more ways to personalize Claude Code, check out how to [customize the status line](/blog/customize_claude_code_status_line) or how I [added sound effects with hooks](/blog/how-i-added-sound-effects-to-claude-code-with-hooks). For a broader overview of all the customization options, see the [full customization guide](/blog/claude-code-customization-guide-claudemd-skills-subagents).

## Make Your Own

Swap the verbs for any theme you like, Star Wars, cooking terms, gym motivation, whatever fits your vibe. The only rule: keep them short so they render cleanly in the terminal.
