---
author: Alexander Opalic
pubDatetime: 2026-04-11T00:00:00Z
title: "How to Use Claude Code as an AI QA Tester with Agent Browser"
description: "Claude Code and Agent Browser let you test your web app in a real browser without hardcoded selectors. Manual browser control, AI-driven exploration, and structured JSON output."
tags: ["claude-code", "testing", "automation", "agent-browser"]
seriesTag: "ai-qa-agent-browser"
seriesTitle: "AI-Powered QA with Claude Code + Agent Browser"
draft: false
---

## Overview

Claude Code and [Agent Browser](https://github.com/vercel-labs/agent-browser) let you test your web app in a real browser without hardcoded selectors. You point Claude at your app, and it clicks through pages, fills forms, and checks for errors. If the layout changes or a new onboarding flow appears, Claude adjusts. No selectors to maintain.

You'll need a web app with a dev server and basic familiarity with the command line and Claude Code.

You'll walk away knowing how to:

- Control a browser from the terminal using Agent Browser's snapshot-and-ref model
- Run one-shot AI-powered browser exploration with `claude -p`
- Separate QA persona from task instructions using `--system-prompt` and `--append-system-prompt`
- Get machine-readable structured JSON output with `--output-format json` and `--json-schema`

Part 1 covers Agent Browser and `claude -p` locally. Part 2 wraps it into a GitHub Actions workflow that runs on every PR.

## Table of Contents

## Background

### The problem

I'm building a workout tracking PWA, a Vue 3 app with exercises, workout flows, templates, timers, and interactive forms. You fix something on one page and break something on another. I had unit tests and integration tests with Vitest, but no answer to: **does the app work when a real user clicks through it?**

Manual QA is tedious. I'd deploy a change, open the app, click around for a few minutes, and call it done. Half the time I'd skip pages I didn't think were affected. I shipped bugs to production: a form that fails without feedback, a navigation link pointing nowhere, a JS error on a page I forgot to check.

I wanted something that could open the app in a real browser, click around like a user, and flag what's broken. Scripted Playwright tests with hardcoded selectors need constant maintenance. I wanted a test runner that could handle a changed layout without a rewrite.

### What we're building

An AI-powered QA workflow where Claude Code drives a real browser via Agent Browser. A single terminal command that:

1. Opens your app in a real browser
2. Claude explores it like a user: clicking navigation, filling forms, checking for JS errors
3. Returns a structured JSON report with any bugs found

Part 2 wraps this into a GitHub Actions workflow that runs on PRs and posts bug reports as comments.

### How Agent Browser works

[Agent Browser](https://github.com/vercel-labs/agent-browser) is a native Rust CLI for browser automation. You issue commands one at a time, which makes it a natural fit for AI agents. It uses Chrome for Testing under the hood, so no Playwright or Node.js runtime is required.

The key concept is **element refs**. `snapshot` returns an accessibility tree where every interactive element has a ref like `@e1`, `@e2`. Claude reads the snapshot, decides what to click, and uses the ref.

```bash
agent-browser open https://www.otto.de    # Open a URL
agent-browser snapshot -i                  # Get interactive elements with refs
agent-browser click @e2                    # Click element by ref
agent-browser fill @e3 "value"             # Fill an input
agent-browser console                      # Check for JS errors
agent-browser screenshot                   # Take a screenshot
agent-browser close                        # Close browser
```

Claude repeats this loop until it has enough information to report:

A concrete example:

1. Claude runs `snapshot -i` and sees: `nav[@e10] > a[@e11] "Home" | a[@e12] "Workouts" | a[@e13] "Settings"`
2. Claude decides to test navigation and runs `click @e12`
3. Claude runs `snapshot -i` again and sees the Workouts page loaded
4. Claude concludes navigation works

Agent Browser uses a client-daemon architecture. The daemon starts on the first command and persists between commands, so subsequent operations are fast.

## Before you start

Before you start, you should:

- Have a web app with a dev server (we use Vite, but any web app works; the examples use `https://www.otto.de`)
- Have Node.js and npm installed
- Have Claude Code installed (`npm install -g @anthropic-ai/claude-code`)

## Step 1: Agent Browser by hand

Before letting Claude drive, get comfortable with Agent Browser yourself. Any public website works.

1. Install Agent Browser globally and set up the browser:

    ```bash
    npm install -g agent-browser
    agent-browser install  # Download Chrome from Chrome for Testing
    ```

2. Open a website:

    ```bash
    agent-browser open https://www.otto.de
    ```

    You'll see:

    ```txt
    ✓ OTTO - Mode, Möbel & Technik » Zum Online-Shop
      https://www.otto.de/
    ```

3. Take a snapshot to see the page structure:

    ```bash
    agent-browser snapshot -i
    ```

    The `-i` flag shows only interactive elements. You'll see something like:

    ```txt
    - button "Zur Hauptnavigation" [ref=e1]
    - link "zur Homepage" [ref=e2]
    - searchbox "Wonach suchst du?" [ref=e3]
    - button "Suche abschicken" [ref=e4]
    - link "s Service" [ref=e5]
    - link "Θ Mein Konto" [ref=e6]
    - link "Merkzettel" [ref=e7]
    - link "Inspiration" [ref=e8]
    - link "Damen-Mode" [ref=e9]
    - link "Herren-Mode" [ref=e10]
    - link "Baby & Kind" [ref=e11]
    ```

    Each `[ref=eN]` is a handle you can interact with using `@eN`.

4. Try clicking a nav link:

    ```bash
    agent-browser click @e9
    ```

    The browser navigates to the Damen-Mode page. Take another snapshot to see the new page:

    ```bash
    agent-browser snapshot -i
    ```

5. Try filling the search box and submitting:

    ```bash
    agent-browser fill @e3 "Sneaker"
    agent-browser press Enter
    ```

6. Check for JavaScript errors:

    ```bash
    agent-browser console
    ```

7. Close the browser when you're done:

    ```bash
    agent-browser close
    ```

Claude runs the same commands in the same order. It reads the snapshot output, picks what to click next, and loops until it has a report.

## Step 2: Let Claude drive with `claude -p`

> 
`claude -p` turns Claude Code into a general-purpose agent. Browser testing is one use case, but the same flags work for data processing, file organization, API calls. If you can script it in a terminal, you can hand it to `claude -p`.

The official [Claude SDK](https://docs.anthropic.com/en/docs/claude-code/sdk) (`@anthropic-ai/claude-code`) exposes the same capabilities programmatically. The flags you learn here (`--allowedTools`, `--json-schema`, `--append-system-prompt`) map directly to SDK parameters in TypeScript and Python.

You can also wire `claude -p` into shell aliases in your `.zshrc` for one-word commands like `cpush` (auto-commit and push) or `clint` (lint your project). See [Claude Code Slash Commands Guide](/blog/claude-code-slash-commands-guide) for examples.

`claude -p` runs Claude Code with a one-shot prompt from the terminal. No interactive session, no back-and-forth.

1. Run Claude with a simple exploration prompt. Say "agent-browser cli" in the prompt. If you leave out "cli", Claude doesn't know which tool to use:

    ```bash
    claude -p "Open https://www.otto.de using agent-browser cli. \
    Take a snapshot. Click one navigation link. \
    Take another snapshot. \
    Tell me what you found." \
    --allowedTools "Bash(agent-browser*)"
    ```

    Watch it work. You'll see each tool call in real time.

    Outcome:

    ```txt
    Here's what I found:

    Snapshot 1 — otto.de Homepage:
    - OTTO is a major German online shop for fashion, furniture, and electronics
    - The top navigation has categories: Inspiration, Damen-Mode, Herren-Mode,
      Baby & Kind, Sport, Beauty & Drogerie, Multimedia, Haushalt, Küche,
      Heimtextilien, Möbel, Baumarkt, Marken, Sale
    - Several promotional banners were visible:
      - 10 EUR coupon for new customers (valid until April 30)
      - 20% extra on fashion & sport (valid until April 13)
      - 20% extra for OTTO-Up members on selected furniture
      - 10% extra on Samsung TVs & soundbars (valid until April 20)

    Snapshot 2 — Multimedia category page:
    After clicking "Multimedia", the page showed a structured product catalog
    with subcategories:
    - Fernseher (TVs): OLED (69), 4K (480), QLED (236), Smart-TVs (428),
      LED (555), 8K (2)
    - Heimkino: Surround systems (186), Soundbars (228),
      Beamer/Projectors (603), Blu-ray players (20), Subwoofers (651),
      DVD players (76)
    - Additional categories for audio, computing, gaming, and accessories

    The site is fully functional, well-structured with clear navigation,
    and currently running several spring sales promotions.
    ```

2. Now give Claude a more structured QA prompt:

    ```bash
    claude -p "You are a QA tester. Open https://www.otto.de using agent-browser cli.

    Test the following:
    1. Does the homepage load? (take a snapshot)
    2. Does navigation work? (click 2 links, snapshot each)
    3. Are there any JS errors? (check console)

    Report your findings as:
    - PASS or FAIL for each test
    - Any bugs found" \
    --allowedTools "Bash(agent-browser*)"
    ```

    Outcome:

    ```txt
    QA Report: otto.de

    Test 1: Homepage Load — PASS
    - URL: https://www.otto.de/
    - Title: "OTTO - Mode, Möbel & Technik » Zum Online-Shop"
    - Page rendered fully with banner, search bar, navigation,
      promotional coupons, and product categories

    Test 2: Navigation — PASS (both links)
    1. Damen-Mode → https://www.otto.de/damen/ — PASS
    2. Multimedia → https://www.otto.de/technik/multimedia/ — PASS
    - Both pages loaded correctly with proper titles and content

    Test 3: JS Errors — PASS
    - agent-browser errors returned no page errors across all 3 pages
    - agent-browser console returned no console warnings/errors

    Bugs Found: None.
    All tests passed cleanly with no JS errors or navigation issues.
    ```

## Step 2b: Separate persona from task with system prompts

In the previous step, the QA persona ("You are a QA tester") was mixed into the task prompt. Claude Code has flags to separate these concerns: `--system-prompt` replaces the default system prompt, and `--append-system-prompt` adds to it.

The Step 2 example rewritten with `--append-system-prompt`:

```bash
claude -p "Open https://www.otto.de using agent-browser cli.

Test the following:
1. Does the homepage load? (take a snapshot)
2. Does navigation work? (click 2 links, snapshot each)
3. Are there any JS errors? (check console)

Report your findings as:
- PASS or FAIL for each test
- Any bugs found" \
    --append-system-prompt "You are a senior QA engineer. Always use \
'agent-browser snapshot -i' for interactive elements only. Be concise \
and structured in your reports." \
    --allowedTools "Bash(agent-browser*)" \
    --max-turns 15
```

Outcome:

```txt
## QA Report: otto.de

| # | Test | Result |
|---|------|--------|
| 1 | **Homepage loads** | **PASS** — Title: "OTTO - Mode, Möbel & Technik » Zum Online-Shop". Full nav bar, search, product recommendations, and brand sections all rendered. |
| 2a | **Navigation: Multimedia** | **PASS** — Clicked "Multimedia" nav link. Category page loaded with subcategories (Fernseher, Heimkino, Audio, etc.) with product counts. |
| 2b | **Navigation: Möbel** | **PASS** — Clicked "Möbel" nav link. Category page loaded with subcategories (Wohnzimmer, Schlafzimmer, etc.) with product counts. |
| 3 | **JS console errors** | **PASS** — No JavaScript errors detected. No failed resource loads (HTTP 4xx/5xx). |

**Bugs found:** None.

All 4 checks passed. The site loads correctly, navigation between category pages works as expected, and no client-side errors were observed.
```

Now the task prompt describes *what* to test. You put the persona and behavioral rules in `--append-system-prompt`, which applies them on every turn without cluttering the task.

### `--system-prompt` vs `--append-system-prompt`

- **`--append-system-prompt`** adds your instructions on top of Claude Code's defaults. Claude still knows how to use Bash, handle errors, etc. Best for most cases.
- **`--system-prompt`** replaces the entire default system prompt. You get full control but lose built-in behaviors. Use this when you want a stripped-down agent that only runs `agent-browser` commands.

### Other useful flags

| Flag | Purpose |
|---|---|
| `--max-turns N` | Caps how many tool-call turns Claude gets. Match to your prompt's scope: 5-8 for a single assertion, 15 for a smoke test, 30+ for deep exploration. |
| `--model` | Pick the model. Use `opus` for thorough QA where you want Claude to reason carefully, `sonnet` for fast smoke tests. |
| `--output-format json` | Machine-readable output (covered in Step 4). |

### Example with all flags

```bash
claude -p "Open https://www.otto.de using agent-browser cli.
Navigate to every page in the main navigation.
Check console for JS errors on each page.
Report PASS/FAIL per page." \
    --append-system-prompt "You are a senior QA engineer testing a \
web shop. Use 'agent-browser snapshot -i' for interactive \
elements only. Be concise." \
    --allowedTools "Bash(agent-browser*)" \
    --max-turns 20 \
    --model opus
```

## Step 3: Try it on your own app

1. Point Claude at your app (here we use otto.de, but swap in your own URL):

    ```bash
    claude -p "Open https://www.otto.de using agent-browser. \
    Take a snapshot. Navigate to 3 different pages. \
    Check console for JS errors on each page. \
    Report what you found." \
    --allowedTools "Bash(agent-browser*)"
    ```

## Step 4: Get structured JSON output

Free-text output works for manual review, but you can't branch a shell script on "PASS" buried in a markdown table.

Claude's output is non-deterministic. You can't predict the exact wording. But your downstream decisions are deterministic: fail the build or don't, post a comment or don't.

`--json-schema` closes that gap. You define the output shape upfront, and Claude conforms to it. Claude still explores pages, interprets errors, and judges severity, but you get a structured JSON object with known fields and value types. Your script reads `verdict` and branches.

`--output-format json` returns a JSON object with session metadata and the result. `--json-schema` forces Claude's response to conform to your schema, landing in a `structured_output` field.

1. Run Claude with a JSON schema to get a structured QA report:

    ```bash
    claude -p "Open https://www.otto.de using agent-browser cli.
    Take a snapshot to verify the page loads.
    Click one navigation link and take another snapshot.
    Check the console for JS errors.
    Return your findings as structured JSON." \
    --output-format json \
    --json-schema '{
      "type": "object",
      "properties": {
        "verdict": {
          "type": "string",
          "enum": ["HEALTHY", "MINOR_ISSUES", "CRITICAL_BUGS"]
        },
        "summary": { "type": "string" },
        "bugs": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "severity": { "type": "string", "enum": ["critical", "major", "minor"] },
              "title": { "type": "string" },
              "description": { "type": "string" }
            },
            "required": ["severity", "title", "description"]
          }
        }
      },
      "required": ["verdict", "summary", "bugs"]
    }' \
    --allowedTools "Bash(agent-browser*)"
    ```

    The full JSON response looks like this (trimmed for readability):

    ```json
    {
      "type": "result",
      "subtype": "success",
      "is_error": false,
      "duration_ms": 78276,
      "duration_api_ms": 71827,
      "num_turns": 13,
      "result": "**Results:**\n\n| Step | Result |\n|------|--------|\n| Open https://www.otto.de | Loaded — title: \"OTTO - Mode, Möbel & Technik » Zum Online-Shop\" |\n| Snapshot #1 (homepage) | Full navigation rendered |\n| Click \"Multimedia\" nav link | Navigated to /technik/multimedia/ |\n| Snapshot #2 (Multimedia page) | Page rendered with breadcrumb, category heading, and sub-navigation |\n| Console JS errors | **None detected** |\n\n**Verdict: HEALTHY**",
      "total_cost_usd": 0.32,
      "structured_output": {
        "verdict": "HEALTHY",
        "summary": "otto.de loads successfully with full navigation, promotional banners, and product content. Navigation to the Multimedia section (/technik/multimedia/) works correctly. No JavaScript console errors or failed resource loads were detected.",
        "bugs": []
      }
    }
    ```

    The `result` field contains Claude's free-text response. The `structured_output` field contains the validated JSON that conforms to your schema. You also get metadata like `duration_ms`, `num_turns`, and `total_cost_usd`.

2. Extract the structured output with `jq`:

    ```bash
    # Pipe the full output through jq to get just the structured data
    claude -p "..." --output-format json --json-schema '...' \
      --allowedTools "Bash(agent-browser*)" \
      | jq '.structured_output'
    ```

    Output:

    ```json
    {
      "verdict": "HEALTHY",
      "summary": "otto.de loads successfully with full navigation, promotional banners, and product content. Navigation to the Multimedia section (/technik/multimedia/) works correctly. No JavaScript console errors or failed resource loads were detected.",
      "bugs": []
    }
    ```

3. Use it in a script to make pass/fail decisions:

    ```bash
    VERDICT=$(claude -p "..." --output-format json --json-schema '...' \
      --allowedTools "Bash(agent-browser*)" \
      | jq -r '.structured_output.verdict')

    if [ "$VERDICT" = "CRITICAL_BUGS" ]; then
      echo "QA failed!"
      exit 1
    fi
    ```

    Inside `claude -p`, Claude explores the app, interprets what it sees, and judges severity. Outside, the `if` statement and `exit 1` are plain bash. `--json-schema` gives you a contract between the two. Without it, you'd grep Claude's prose for the word "CRITICAL" and hope it doesn't rephrase.

This same mechanism powers the GitHub Actions workflow in Part 2. Get it working locally first, fewer surprises in CI.

## Summary

You now have:

- Browser control from the terminal with Agent Browser's snapshot-and-ref model
- One-shot AI-powered exploration with `claude -p`
- Persona separation via `--append-system-prompt`, execution control via `--max-turns` and `--model`
- Structured JSON output with `--output-format json` and `--json-schema`

All of this runs locally. Part 2 moves it into CI: a GitHub Actions workflow using Claude Code Action that runs Claude as a QA agent on every PR, posts structured bug reports as comments, and sets commit statuses (green/yellow/red). Coming soon.

## Next steps

- [Building an AI QA Engineer with Playwright MCP](/blog/building_ai_qa_engineer_claude_code_playwright), the MCP-based version with richer browser control
- [Claude Code Skills, Hooks, and Subagents](/blog/claude_code_skills_hooks_subagents_vue_workout_tracker), creating reusable skills for your QA prompts
- [Claude Code Customization Guide](/blog/claude-code-customization-guide-claudemd-skills-subagents), deeper coverage of CLAUDE.md, skills, and subagents
- [Agent Browser documentation](https://github.com/vercel-labs/agent-browser), full command reference and setup guide
