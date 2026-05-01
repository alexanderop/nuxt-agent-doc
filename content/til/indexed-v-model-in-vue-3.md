---
author: Alexander Opalic
pubDatetime: 2025-05-16T12:00:00Z
title: "Indexed v-model in Vue 3"
slug: indexed-v-model-in-vue-3
description: "TIL about handling any number of inputs with one reactive array by binding each field to array[index] in Vue 3."
tags: ["vue"]
featured: false
draft: false
---

## 📝 TIL — _Indexed `v-model`_ in Vue 3

> **Today I learned** that you can handle **any number of inputs** with **one reactive array** by binding each field to `array[index]`.
> It's the simplest way to keep dynamic rows in sync—no prop-drilling, no form library, no extra components.

---

### The 4-step recipe

1.  **Define your dynamic list:**

    ```js
    const rows = reactive([{ id: 1 } /* ... */]);
    ```

    - This is your dynamic list, which could come from props or an API call.

2.  **Create a ref for input values:**

    ```ts
    const values = ref<string[]>([]);
    ```

    - This will be the single source of truth for all corresponding inputs.

3.  **Keep `values` in sync with `rows`:**

    ```js
    watchEffect(() => {
      values.value = rows.map((_, i) => values.value[i] ?? "");
    });
    ```

    - This `watchEffect` ensures that the `values` array has the same length as the `rows` array, preserving any existing user input when rows are added or removed.

4.  **Bind inputs in your template:**

    ```html
    <input v-model="values[i]" />
    ```

    - Inside your `v-for` loop, bind each input to its corresponding element in the `values` array using `values[i]`.

That's it—**four key pieces of logic**.

---

### 🧪 30-second Proof-of-Concept

**Play with it**

- Add rows → the `values` array grows automatically.
- Type in any input → its value appears at the matching index.
- Remove rows → the input and its value disappear together.

---

### Why this pattern rocks

1. **Zero boilerplate** – one array, one watch, done.
2. **Reorder-safe** – as long as you keep stable keys (`:key="row.id"`), Vue keeps DOM ↔︎ array indices aligned.
3. **Easy aggregates** – totals, validation, API payloads are all `values.value` away:

   ```js
   const total = computed(() => values.value.reduce((s, n) => s + +n, 0));
   ```

Use it whenever your UI says "N inputs where N can change." This is particularly useful when you have a dynamic table with input fields and you need to have validation.
