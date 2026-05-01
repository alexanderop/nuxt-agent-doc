---
author: Alexander Opalic
pubDatetime: 2026-02-03T00:00:00Z
title: "VMark: Hand-Drawn Annotations for Presentations"
slug: vmark-tutorial
description: "Learn how to add animated hand-drawn annotations to your presentations using VMark. A complete tutorial covering all annotation types, colors, and timing controls."
tags: ["presentation", "tutorial", "documentation"]
draft: false
presentation: true
---

# VMark: Hand-Drawn Annotations

Add emphasis to your presentations with animated hand-drawn marks

---

## The Problem

Static text in presentations lacks emphasis.

We want **this** to stand out.

VMark creates a "live drawing" effect that grabs attention and guides your audience's focus.

---

## Getting Started

Import VMark from the presentation feature:

```tsx
import { VMark } from "@features/presentation";
```

Basic usage wraps text in the component:

```tsx
<VMark>text to emphasize</VMark>
```

The default is underline, and it animates on click.

---

## Annotation Types: Underline & Circle

Underline is the default. Use it for general emphasis.

Circle draws attention to key terms or important words.

```tsx
<VMark type="underline">emphasis</VMark>
<VMark type="circle" color="red">key term</VMark>
```

---

## Annotation Types: Box & Highlight

Box frames content like code or definitions.

Highlight creates a marker effect. It uses 40% opacity so text stays readable.

```tsx
<VMark type="box" color="green">boxed</VMark>
<VMark type="highlight" color="yellow">highlighted</VMark>
```

---

## Annotation Types: Strike-through & Crossed-off

Use these for corrections or showing what to avoid:

This approach is wrong

Don't do this

Common pattern: show the wrong approach, then reveal the correct one.

---

## Annotation Type: Bracket

  Brackets emphasize entire phrases or sentences

The `brackets` prop controls direction:

```tsx
<VMark type="bracket" brackets={['left', 'right']}>
  phrase
</VMark>
```

Options: `left`, `right`, `top`, `bottom`

---

## Color Presets

VMark includes 24 color presets:

red | blue | green | yellow | purple | orange

cyan | teal | pink | indigo | lime | amber

Custom CSS colors also work: `#ff6b6b`, `rgb(100, 200, 150)`, `rgba(255, 0, 0, 0.5)`

---

## Controlling Timing: Sequential

By default, VMark annotations appear sequentially with each click.

This one appears second.

And this one third.

Just place VMark components in order. Each one advances the click counter.

---

## Controlling Timing: Explicit

Use `at` to specify an exact click number:

Third (at=3)

First (at=1)

Second (at=2)

```tsx
<VMark at={3}>appears on click 3</VMark>
<VMark at={1}>appears on click 1</VMark>
```

---

## Advanced Timing: Relative & Ranges

Relative positioning with `+N`:

+1 from previous

Ranges show content only during a window:

Visible from click 3 to 4

```tsx
<VMark at="+1">offset from previous</VMark>
<VMark at={[2, 5]}>visible during clicks 2-4</VMark>
```

---

## Under the Hood

VMark is built on the rough-notation library.

Key behaviors:

- Generates SVG annotations at runtime
- Respects `prefers-reduced-motion` (instant show, no animation)
- Works with print/export mode (`?print=true`)
- Annotations are visual only. Screen readers see just the text

---

## Summary

Import from `@features/presentation`

7 annotation types: underline, circle, box, highlight, strike-through, crossed-off, bracket

24 color presets plus custom CSS colors

Full click system integration with `at` prop for timing control

Press **Escape** to exit presentation mode.
