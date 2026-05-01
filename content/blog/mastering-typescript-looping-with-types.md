---
author: Alexander Opalic
pubDatetime: 2022-09-23T15:22:00Z
modDatetime: 2023-12-21T09:12:47.400Z
title: "Mastering TypeScript: Looping with Types"
slug: mastering-typescript-looping-with-types
draft: false
tags:
  - typescript
description: "Did you know that TypeScript is Turing complete? In this post, I will show you how you can loop with TypeScript."
---

## Introduction

Loops play a pivotal role in programming, enabling code execution without redundancy. JavaScript developers might be familiar with `foreach` or `do...while` loops, but TypeScript offers unique looping capabilities at the type level. This blog post delves into three advanced TypeScript looping techniques, demonstrating their importance and utility.

## Mapped Types

Mapped Types in TypeScript allow the transformation of object properties. Consider an object requiring immutable properties:

```typescript
type User = {
  id: string;
  email: string;
  age: number;
};
```

We traditionally hardcode it to create an immutable version of this type. To maintain adaptability with the original type, Mapped Types come into play. They use generics to map each property, offering flexibility to transform property characteristics. For instance:

```typescript
type ReadonlyUser<T> = {
  readonly [P in keyof T]: T[P];
};
```

This technique is extensible. For example, adding nullability:

```typescript
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};
```

Or filtering out certain types:

```typescript
type ExcludeStrings<T> = {
  [P in keyof T as T[P] extends string ? never : P]: T[P];
};
```

Understanding the core concept of Mapped Types opens doors to creating diverse, reusable types.

## Recursion

Recursion is fundamental in TypeScript's type-level programming since state mutation is not an option. Consider applying immutability to all nested properties:

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
```

Here, TypeScript's compiler recursively ensures every property is immutable, demonstrating the language's depth in handling complex types.

## Union Types

Union Types represent a set of distinct types, such as:

```typescript
const hi = "Hello";
const msg = `${hi}, world`;
```

Creating structured types from unions involves looping over each union member. For instance, constructing a type where each status is an object:

```typescript
type Status = "Failure" | "Success";
type StatusObject = Status extends infer S ? { status: S } : never;
```

## Conclusion

TypeScript's advanced type system transcends static type checking, providing sophisticated tools for type transformation and manipulation. Mapped Types, Recursion, and Union Types are not mere features but powerful instruments that enhance code maintainability, type safety, and expressiveness. These techniques underscore TypeScript's capability to handle complex programming scenarios, affirming its status as more than a JavaScript superset but a language that enriches our development experience.
