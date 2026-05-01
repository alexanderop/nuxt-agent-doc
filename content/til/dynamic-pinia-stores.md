---
author: "Alexander Opalic"
title: "Dynamic Pinia Stores in Vue 3"
pubDatetime: 2024-11-28T15:22:00Z
tags: ["vue", "pinia", "typescript"]
description: "Create dynamic Pinia stores with unique IDs for separate component instances"
---

Today I learned how to create dynamic Pinia stores in Vue 3 by generating unique store IDs. This is super useful when you need separate state management for different instances of the same component, like data tables or forms.

Here's how to do it:

```typescript
const useStore = (id: string) =>
  defineStore(`store-${id}`, () => {
    const data = ref({});

    return { data };
  })();

// Usage example:
const tableOneStore = useStore("table1");
const tableTwoStore = useStore("table2");
```

Each store instance gets its own isolated state, making it perfect for managing independent components. This approach prevents state conflicts and keeps your data properly organized.

Key benefits:

- Isolated state per component instance
- Clean and maintainable code
- Type-safe with TypeScript
- Perfect for dynamic components

#VueJS
