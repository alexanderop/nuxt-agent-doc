---
author: Alexander Opalic
pubDatetime: 2024-10-08T00:00:00Z
modDatetime: 2024-10-08T00:00:00Z
title: "Atomic Architecture: Structuring Vue and Nuxt Projects"
slug: atomic-design-vue-or-nuxt
draft: false
tags:
  - vue
  - architecture
seriesTag: vue-architecture
seriesTitle: "Vue Architecture Guide"
description: "Learn how to implement Atomic Design principles in Vue or Nuxt projects. Improve your code structure and maintainability with this guide"
---

## Introduction

Clear writing requires clear thinking. The same is valid for coding.
Throwing all components into one folder may work when starting a personal project.
But as projects grow, especially with larger teams, this approach leads to problems:

- Duplicated code
- Oversized, multipurpose components
- Difficult-to-test code

Atomic Design offers a solution. Let's examine how to apply it to a Nuxt project.

## What is Atomic Design

![atomic design diagram brad Frost](../../assets/images/atomic/diagram.svg)

Brad Frost developed Atomic Design as a methodology for creating design systems. He structured it into five levels inspired by chemistry:

1. Atoms: Basic building blocks (e.g. form labels, inputs, buttons)
2. Molecules: Simple groups of UI elements (e.g. search forms)
3. Organisms: Complex components made of molecules/atoms (e.g. headers)
4. Templates: Page-level layouts
5. Pages: Specific instances of templates with content

> 
  Read Brad Frost's original post for the full picture: [Atomic Web
  Design](https://bradfrost.com/blog/post/atomic-web-design/)

For Nuxt, we can adapt these definitions:

- Atoms: Pure, single-purpose components
- Molecules: Combinations of atoms with minimal logic
- Organisms: Larger, self-contained, reusable components
- Templates: Nuxt layouts defining page structure
- Pages: Components handling data and API calls

> 

Molecules and organisms can be confusing. Think of it like LEGO:

- Molecules are small and simple. Individual bricks that snap together.
  Examples:
  - A search bar (input + button)
  - A login form (username input + password input + submit button)
  - A star rating (5 star icons + rating number)

- Organisms are bigger and more complex. Pre-built sets.
  Examples:
  - A full website header (logo + navigation menu + search bar)
  - A product card (image + title + price + add to cart button)
  - A comment section (comment form + list of comments)

Remember: Molecules are parts of organisms, but organisms can work independently.

### Code Example: Before and After

#### Consider this non-Atomic Design todo app component:

![Screenshot of ToDo App](../../assets/images/atomic/screenshot-example-app.png)

```vue
<template>
  <div class="container mx-auto p-4">
    <h1 class="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-200">
      Todo App
    </h1>

    <!-- Add Todo Form -->
    <form @submit.prevent="addTodo" class="mb-4">
      <input
        v-model="newTodo"
        type="text"
        placeholder="Enter a new todo"
        class="mr-2 rounded border bg-white p-2 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
      />
      <button
        type="submit"
        class="rounded bg-blue-500 p-2 text-white transition duration-300 hover:bg-blue-600"
      >
        Add Todo
      </button>
    </form>

    <!-- Todo List -->
    <ul class="space-y-2">
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="flex items-center justify-between rounded bg-gray-100 p-3 shadow-sm dark:bg-gray-700"
      >
        <span class="text-gray-800 dark:text-gray-200">{{ todo.text }}</span>
        <button
          @click="deleteTodo(todo.id)"
          class="rounded bg-red-500 p-1 text-white transition duration-300 hover:bg-red-600"
        >
          Delete
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

interface Todo {
  id: number;
  text: string;
}

const newTodo = ref("");
const todos = ref<Todo[]>([]);

const fetchTodos = async () => {
  // Simulating API call
  todos.value = [
    { id: 1, text: "Learn Vue.js" },
    { id: 2, text: "Build a Todo App" },
    { id: 3, text: "Study Atomic Design" },
  ];
};

const addTodo = async () => {
  if (newTodo.value.trim()) {
    // Simulating API call
    const newTodoItem: Todo = {
      id: Date.now(),
      text: newTodo.value,
    };
    todos.value.push(newTodoItem);
    newTodo.value = "";
  }
};

const deleteTodo = async (id: number) => {
  // Simulating API call
  todos.value = todos.value.filter(todo => todo.id !== id);
};

onMounted(fetchTodos);
</script>
```

This approach leads to large, difficult-to-maintain components. Let's refactor using Atomic Design:

### This will be the refactored structure

```shell
📐 Template (Layout)
   │
   └─── 📄 Page (TodoApp)
        │
        └─── 📦 Organism (TodoList)
             │
             ├─── 🧪 Molecule (TodoForm)
             │    │
             │    ├─── ⚛️ Atom (BaseInput)
             │    └─── ⚛️ Atom (BaseButton)
             │
             └─── 🧪 Molecule (TodoItems)
                  │
                  └─── 🧪 Molecule (TodoItem) [multiple instances]
                       │
                       ├─── ⚛️ Atom (BaseText)
                       └─── ⚛️ Atom (BaseButton)
```

### Refactored Components

#### Template Default

```vue
<template>
  <div
    class="min-h-screen bg-gray-100 text-gray-900 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100"
  >
    <header class="bg-white shadow dark:bg-gray-800">
      <nav
        class="container mx-auto flex items-center justify-between px-4 py-4"
      >
        <NuxtLink to="/" class="text-xl font-bold">Todo App</NuxtLink>
        <ThemeToggle />
      </nav>
    </header>
    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import ThemeToggle from "~/components/ThemeToggle.vue";
</script>
```

#### Pages

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import TodoList from "../components/organisms/TodoList";

interface Todo {
  id: number;
  text: string;
}

const todos = ref<Todo[]>([]);

const fetchTodos = async () => {
  // Simulating API call
  todos.value = [
    { id: 1, text: "Learn Vue.js" },
    { id: 2, text: "Build a Todo App" },
    { id: 3, text: "Study Atomic Design" },
  ];
};

const addTodo = async (text: string) => {
  // Simulating API call
  const newTodoItem: Todo = {
    id: Date.now(),
    text,
  };
  todos.value.push(newTodoItem);
};

const deleteTodo = async (id: number) => {
  // Simulating API call
  todos.value = todos.value.filter(todo => todo.id !== id);
};

onMounted(fetchTodos);
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-200">
      Todo App
    </h1>
    <TodoList :todos="todos" @add-todo="addTodo" @delete-todo="deleteTodo" />
  </div>
</template>
```

#### Organism (TodoList)

```vue
<script setup lang="ts">
import TodoForm from "../molecules/TodoForm.vue";
import TodoItem from "../molecules/TodoItem.vue";

interface Todo {
  id: number;
  text: string;
}

defineProps<{
  todos: Todo[];
}>();

defineEmits<{
  (e: "add-todo", value: string): void;
  (e: "delete-todo", id: number): void;
}>();
</script>

<template>
  <div>
    <TodoForm @add-todo="$emit('add-todo', $event)" />
    <ul class="space-y-2">
      <TodoItem
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        @delete-todo="$emit('delete-todo', $event)"
      />
    </ul>
  </div>
</template>
```

#### Molecules (TodoForm and TodoItem)

##### TodoForm.vue:

```vue
<script setup lang="ts">
import { ref } from "vue";
import BaseInput from "../atoms/BaseInput.vue";
import BaseButton from "../atoms/BaseButton.vue";

const newTodo = ref("");
const emit = defineEmits<{
  (e: "add-todo", value: string): void;
}>();

const addTodo = () => {
  if (newTodo.value.trim()) {
    emit("add-todo", newTodo.value);
    newTodo.value = "";
  }
};
</script>

<template>
  <form @submit.prevent="addTodo" class="mb-4">
    <BaseInput v-model="newTodo" placeholder="Enter a new todo" />
    <BaseButton type="submit">Add Todo</BaseButton>
  </form>
</template>
```

##### TodoItem.vue:

```vue
<script setup lang="ts">
import BaseButton from "../atoms/BaseButton.vue";
import BaseText from "../atoms/BaseText.vue";

interface Todo {
  id: number;
  text: string;
}

const props = defineProps<{
  todo: Todo;
}>();

defineEmits<{
  (e: "delete-todo", id: number): void;
}>();
</script>

<template>
  <li class="flex items-center justify-between">
    <BaseText>{{ todo.text }}</BaseText>
    <BaseButton variant="danger" @click="$emit('delete-todo', todo.id)">
      Delete
    </BaseButton>
  </li>
</template>
```

#### Atoms (BaseButton, BaseInput, BaseText)

##### BaseButton.vue:

```vue
<script setup lang="ts">
defineProps<{
  variant?: "primary" | "danger";
}>();
</script>

<template>
  <button
    :class="[
      'rounded p-2 transition duration-300',
      variant === 'danger'
        ? 'bg-red-500 text-white hover:bg-red-600'
        : 'bg-blue-500 text-white hover:bg-blue-600',
    ]"
  >
    <slot></slot>
  </button>
</template>
```

#### BaseInput.vue:

```vue
<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder?: string;
}>();
defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<template>
  <input
    :value="modelValue"
    @input="
      $emit('update:modelValue', ($event.target as HTMLInputElement).value)
    "
    type="text"
    :placeholder="placeholder"
    class="mr-2 rounded border bg-white p-2 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
  />
</template>
```

> 
  Want to check out the full example yourself? [click
  me](https://github.com/alexanderop/todo-app-example)

| Component Level | Job                                                                                           | Examples                                            |
| --------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Atoms           | Pure, single-purpose components                                                               | BaseButton BaseInput BaseIcon BaseText              |
| Molecules       | Combinations of atoms with minimal logic                                                      | SearchBar LoginForm StarRating Tooltip              |
| Organisms       | Larger, self-contained, reusable components. Can perform side effects and complex operations. | TheHeader ProductCard CommentSection NavigationMenu |
| Templates       | Nuxt layouts defining page structure                                                          | DefaultLayout BlogLayout DashboardLayout AuthLayout |
| Pages           | Components handling data and API calls                                                        | HomePage UserProfile ProductList CheckoutPage       |

## Summary

Atomic Design gives you a clear code structure and works well as a starting point.
As complexity grows, other architectures may fit better.
My post on [How to structure vue Projects](../how-to-structure-vue-projects) covers approaches beyond Atomic Design for larger projects.
