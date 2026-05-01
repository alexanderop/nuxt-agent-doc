---
author: Alexander Opalic
pubDatetime: 2024-09-23T00:00:00Z
modDatetime: 2024-09-23T00:00:00Z
title: "TypeScript Tutorial: Extracting All Keys from Nested Object"
slug: typescript-extract-all-keys-nested-objects
draft: false
tags:
  - typescript
description: "Learn how to extract all keys, including nested ones, from TypeScript objects using advanced type manipulation techniques. Improve your TypeScript skills and write safer code."
---

## What's the Problem?

Let's say you have a big TypeScript object. It has objects inside objects. You want to get all the keys, even the nested ones. But TypeScript doesn't provide this functionality out of the box.

Look at this User object:

```typescript twoslash
type User = {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
  };
};
```

You want "id", "name", and "address.street". The standard approach is insufficient:

```typescript
// little helper to prettify the type on hover
type Pretty<T> = {
  [K in keyof T]: T[K];
} & {};

type UserKeys = keyof User;
type PrettyUserKeys = Pretty<UserKeys>;
```

This approach returns the top-level keys, missing nested properties like "address.street".

We need a more sophisticated solution using TypeScript's advanced features:

1. Conditional Types (if-then for types)
2. Mapped Types (change each part of a type)
3. Template Literal Types (make new string types)
4. Recursive Types (types that refer to themselves)

Here's our solution:

```typescript
type ExtractKeys<T> = T extends object
  ? {
      [K in keyof T & string]:
        | K
        | (T[K] extends object ? `${K}.${ExtractKeys<T[K]>}` : K);
    }[keyof T & string]
  : never;
```

Let's break down this type definition:

1. We check if T is an object.
2. For each key in the object:
3. We either preserve the key as-is, or
4. If the key's value is another object, we combine the key with its nested keys
5. We apply this to the entire type structure

Now let's use it:

```typescript
type UserKeys = ExtractKeys<User>;
```

This gives us all keys, including nested ones.

The practical benefits become clear in this example:

```typescript
const user: User = {
  id: "123",
  name: "John Doe",
  address: {
    street: "Main St",
    city: "Berlin",
  },
};

function getProperty(obj: User, key: UserKeys) {
  const keys = key.split(".");
  let result: any = obj;

  for (const k of keys) {
    result = result[k];
  }

  return result;
}

// This works
getProperty(user, "address.street");

// This gives an error
getProperty(user, "address.country");
```

TypeScript detects potential errors during development.

Important Considerations:

1. This type implementation may impact performance with complex nested objects.
2. The type system enhances development-time safety without runtime overhead.
3. Consider the trade-off between type safety and code readability.

## Wrap-Up

We've explored how to extract all keys from nested TypeScript objects. This technique provides enhanced type safety for your data structures. Consider the performance implications when implementing this in your projects.
