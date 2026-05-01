---
title: "TypeScript Type Extraction Patterns"
author: Alexander Opalic
pubDatetime: 2025-01-04T00:00:00Z
description: "Learn powerful TypeScript patterns for extracting and transforming nested types from complex interfaces."
tags: ["typescript", "types", "patterns"]
---

## Extract Nested Types from Complex Interfaces

```ts
interface GetTodoQuery {
  todo?: {
    id: number;
    title: string;
    completed: boolean;
    tags?: Array<{
      id: number;
      name: string;
      color: string;
    }> | null;
    collaborators?: Array<{
      userId: number;
      role: "VIEWER" | "EDITOR";
      joinedAt: string;
    }> | null;
  };
}

// Extract nested types with proper type narrowing
type TodoTags = NonNullable<NonNullable<GetTodoQuery["todo"]>["tags"]>;
type TodoTag = TodoTags[number];
```

## Key Patterns

1. Handle optional properties: `NonNullable<T>` removes `undefined` and `null`
2. Access nested types: Chain properties using `['prop']`
3. Extract array item type: Use `[number]` index

Perfect for working with GraphQL queries and complex API responses where you need to extract specific nested types with proper type narrowing.
