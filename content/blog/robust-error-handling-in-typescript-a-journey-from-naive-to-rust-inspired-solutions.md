---
author: Alexander Opalic
pubDatetime: 2023-11-18T15:22:00Z
modDatetime: 2023-11-18T15:22:00Z
title: "Robust Error Handling in TypeScript: A Journey from Naive to Rust-Inspired Solutions"
slug: robust-error-handling-in-typescript-a-journey-from-naive-to-rust-inspired-solutions
draft: false
tags:
  - typescript
description: "Learn to write robust, predictable TypeScript code using Rust's Result pattern. This post demonstrates practical examples and introduces the ts-results library, implementing Rust's powerful error management approach in TypeScript."
---

## Introduction

In software development, robust error handling forms the foundation of reliable software. Even the best-written code encounters unexpected challenges in production. This post explores how to enhance TypeScript error handling with Rust's Result pattern—creating more resilient and explicit error management.

## The Pitfalls of Overlooking Error Handling

Consider this TypeScript division function:

```typescript
const divide = (a: number, b: number) => a / b;
```

This function appears straightforward but fails when `b` is zero, returning `Infinity`. Such overlooked cases can lead to illogical outcomes:

```typescript
const divide = (a: number, b: number) => a / b;
// ---cut---
const calculateAverageSpeed = (distance: number, time: number) => {
  const averageSpeed = divide(distance, time);
  return `${averageSpeed} km/h`;
};

// will be "Infinity km/h"
console.log("Average Speed: ", calculateAverageSpeed(50, 0));
```

## Embracing Explicit Error Handling

TypeScript provides powerful error management techniques. The Rust-inspired approach enhances code safety and predictability.

### Result Type Pattern: A Rust-Inspired Approach in TypeScript

Rust excels at explicit error handling through the `Result` type. Here's the pattern in TypeScript:

```typescript
type Success<T> = { kind: "success"; value: T };
type Failure<E> = { kind: "failure"; error: E };
type Result<T, E> = Success<T> | Failure<E>;

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { kind: "failure", error: "Cannot divide by zero" };
  }
  return { kind: "success", value: a / b };
}
```

### Handling the Result in TypeScript

```typescript
const handleDivision = (result: Result<number, string>) => {
  if (result.kind === "success") {
    console.log("Division result:", result.value);
  } else {
    console.error("Division error:", result.error);
  }
};

const result = divide(10, 0);
handleDivision(result);
```

### Native Rust Implementation for Comparison

In Rust, the `Result` type is an enum with variants for success and error:

```rust

fn divide(a: i32, b: i32) -> std::result::Result<i32, String> {
    if b == 0 {
        std::result::Result::Err("Cannot divide by zero".to_string())
    } else {
        std::result::Result::Ok(a / b)
    }
}

fn main() {
    match divide(10, 2) {
        std::result::Result::Ok(result) => println!("Division result: {}", result),
        std::result::Result::Err(error) => println!("Error: {}", error),
    }
}

```

### Why the Rust Way?

1. **Explicit Handling**: Forces handling of both outcomes, enhancing code robustness.
2. **Clarity**: Makes code intentions clear.
3. **Safety**: Reduces uncaught exceptions.
4. **Functional Approach**: Aligns with TypeScript's functional programming style.

## Leveraging ts-results for Rust-Like Error Handling

For TypeScript developers, the [ts-results](https://github.com/vultix/ts-results) library is a great tool to apply Rust's error handling pattern, simplifying the implementation of Rust's `Result` type in TypeScript.

## Conclusion

Implementing Rust's `Result` pattern in TypeScript, with tools like ts-results, enhances error handling strategies. This approach creates robust applications that handle errors while maintaining code integrity and usability.

Let's embrace these practices to craft software that withstands the tests of time and uncertainty.
