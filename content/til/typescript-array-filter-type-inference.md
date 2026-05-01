---
author: "Alexander Opalic"
title: "Better Type Inference with TypeScript Array Filters"
pubDatetime: 2025-01-02T15:22:00Z
tags: ["typescript", "arrays", "type-inference"]
description: "How to improve TypeScript type inference when filtering arrays using type guards"
---

Today I learned about the difference between using Boolean as a filter function versus using a proper type guard for array filtering in TypeScript.

While `Boolean` can remove falsy values, it doesn't improve TypeScript's type inference:

```ts twoslash
const numbers = [1, null, 2, undefined, 3].filter(Boolean);
const type = numbers;
//    ^?
```

The type remains `(number | null | undefined)[]` because TypeScript doesn't understand that we're removing null and undefined values.

Using a type guard provides proper type inference:

```ts twoslash
const numbersTyped = [1, null, 2, undefined, 3].filter(
  (num): num is NonNullable<typeof num> => num !== null && num !== undefined
);
const type = numbersTyped;
//    ^?
```

TypeScript infers the type as `number[]`!

Key takeaways:

- Use type guards instead of `Boolean` for better type inference
- `NonNullable<T>` is a useful utility type for removing null and undefined
- Type predicates (`is` keyword) help TypeScript understand our filtering logic
