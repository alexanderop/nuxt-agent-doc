---
author: Alexander Opalic
pubDatetime: 2024-12-15T00:00:00Z
title: "How to Use the Variant Props Pattern in Vue"
slug: vue-typescript-variant-props-type-safe-props
draft: false
tags:
  - vue
  - typescript
description: "Learn how to create type-safe Vue components where prop types depend on other props using TypeScript discriminated unions. A practical guide with real-world examples."
---

Building Vue components that handle multiple variations while maintaining type safety can be tricky. Let's dive into the Variant Props Pattern (VPP) - a powerful approach that uses TypeScript's discriminated unions with Vue's composition API to create truly type-safe component variants.

## TL;DR

The Variant Props Pattern in Vue combines TypeScript's discriminated unions with Vue's prop system to create type-safe component variants. Instead of using complex type utilities, we explicitly mark incompatible props as never to prevent prop mixing at compile time:

```typescript
// Define base props
type BaseProps = {
  title: string;
};

// Success variant prevents error props
type SuccessProps = BaseProps & {
  variant: "success";
  message: string;
  errorCode?: never; // Prevents mixing
};

// Error variant prevents success props
type ErrorProps = BaseProps & {
  variant: "error";
  errorCode: string;
  message?: never; // Prevents mixing
};

type Props = SuccessProps | ErrorProps;
```

This pattern provides compile-time safety, excellent IDE support, and reliable vue-tsc compatibility. Perfect for components that need multiple, mutually exclusive prop combinations.

## The Problem: Mixed Props Nightmare

Picture this: You're building a notification component that needs to handle both success and error states. Each state has its own specific properties:

- Success notifications need a `message` and `duration`
- Error notifications need an `errorCode` and a `retryable` flag

Without proper type safety, developers might accidentally mix these props:

```html
<!-- This should fail! -->
<NotificationAlert
  variant="primary"
  title="Data Saved"
  message="Success!"
  errorCode="UPLOAD_001"  <!-- 🚨 Mixing success and error props -->
  :duration="5000"
  @close="handleClose"
/>
```

## The Simple Solution That Doesn't Work

Your first instinct might be to define separate interfaces:

```typescript
interface SuccessProps {
  title: string;
  variant: "primary" | "secondary";
  message: string;
  duration: number;
}

interface ErrorProps {
  title: string;
  variant: "danger" | "warning";
  errorCode: string;
  retryable: boolean;
}

// 🚨 This allows mixing both types!
type Props = SuccessProps & ErrorProps;
```

The problem? This approach allows developers to use both success and error props simultaneously - definitely not what we want!

## Using Discriminated Unions with `never`

> **TypeScript Tip**: The `never` type is a special type in TypeScript that represents values that never occur. When a property is marked as `never`, TypeScript ensures that value can never be assigned to that property. This makes it perfect for creating mutually exclusive props, as it prevents developers from accidentally using props that shouldn't exist together.
>
> The `never` type commonly appears in TypeScript in several scenarios:
>
> - Functions that never return (throw errors or have infinite loops)
> - Exhaustive type checking in switch statements
> - Impossible type intersections (e.g., `string & number`)
> - Making properties mutually exclusive, as we do in this pattern

The main trick to make it work with the current implmenation of defineProps is to use `never` to explicitly mark unused variant props.

```typescript
// Base props shared between variants
type BaseProps = {
  title: string;
};

// Success variant
type SuccessProps = BaseProps & {
  variant: "primary" | "secondary";
  message: string;
  duration: number;
  // Explicitly mark error props as never
  errorCode?: never;
  retryable?: never;
};

// Error variant
type ErrorProps = BaseProps & {
  variant: "danger" | "warning";
  errorCode: string;
  retryable: boolean;
  // Explicitly mark success props as never
  message?: never;
  duration?: never;
};

// Final props type - only one variant allowed!
type Props = SuccessProps | ErrorProps;
```

## Important Note About Vue Components

When implementing this pattern, you'll need to make your component generic due to a current type restriction in `defineComponent`.
By making the component generic, we can bypass `defineComponent` and define the component as a functional component:

```vue
<script setup lang="ts" generic="T">
// Now our discriminated union props will work correctly
type BaseProps = {
  title: string;
};

type SuccessProps = BaseProps & {
  variant: "primary" | "secondary";
  message: string;
  duration: number;
  errorCode?: never;
  retryable?: never;
};

// ... rest of the types
</script>
```

This approach allows TypeScript to properly enforce our prop variants at compile time.

## Putting It All Together

Here's our complete notification component using the Variant Props Pattern:

## Conclusion

The Variant Props Pattern (VPP) provides a robust approach for building type-safe Vue components. While the Vue team is working on improving native support for discriminated unions [in vuejs/core#8952](https://github.com/vuejs/core/issues/8952), this pattern offers a practical solution today:

Unfortunately, what currently is not working is using helper utility types like Xor so that we don't have to
manually mark unused variant props as never. When you do that, you will get an error from vue-tsc.

Example of a helper type like Xor:

```typescript
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

// Success notification properties
type SuccessProps = {
  title: string;
  variant: "primary" | "secondary";
  message: string;
  duration: number;
};

// Error notification properties
type ErrorProps = {
  title: string;
  variant: "danger" | "warning";
  errorCode: string;
  retryable: boolean;
};

// Final props type - only one variant allowed! ✨
type Props = XOR<SuccessProps, ErrorProps>;
```

## Video Reference

If you also prefer to learn this in video format, check out this tutorial:

