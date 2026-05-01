---
author: "Alexander Opalic"
title: "TIL: TypeScript Function Overloads"
pubDatetime: 2025-04-08T15:22:00Z
tags: ["typescript"]
description: "Today I learned about function overloads in TypeScript. They solve a common problem - making your code understand exactly what type comes out based on what type goes in."
---

## What Function Overloads Do

Function overloads let me define multiple ways to call the same function:

```typescript
// These tell TypeScript about different ways to call my function
function convert(value: string): number;
function convert(value: number): string;

// This is the actual function that runs
function convert(value: string | number): string | number {
  if (typeof value === "string") {
    return parseInt(value);
  } else {
    return value.toString();
  }
}

const a = convert("42"); // TypeScript knows this is a number
const b = convert(42); // TypeScript knows this is a string
```

## How This Improves My Code

Without overloads, I'd have to use a union type, which loses information:

```typescript
function convert(value: string | number): string | number {
  if (typeof value === "string") {
    return parseInt(value);
  } else {
    return value.toString();
  }
}

const a = convert("42"); // TypeScript only knows this is string | number
const b = convert(42); // TypeScript only knows this is string | number
```

With overloads, TypeScript remembers which type I get back based on what I put in!

## Overloads vs. Union Types

- **Overloads**: More precise typing, TypeScript knows exactly which output type matches which input type
- **Union types**: Simpler code, but TypeScript only knows all possible output types, not which specific one

## Limitations in TypeScript

The big drawback? In TypeScript, I can't write separate code for each overload. I write one function that handles all cases. This gets messy with complex functions.

C++ does this better. In C++, each overload is a completely separate function:

```cpp
// Two totally separate functions
void convert(int value) {
    // Code for integers only
    cout << to_string(value) << endl;
}

void convert(string value) {
    // Different code for strings only
    cout << stoi(value) << endl;
}
```

In TypeScript, I have to write my own type-checking logic to figure out which version was called. This makes overloads in TypeScript harder to use for complex cases.
