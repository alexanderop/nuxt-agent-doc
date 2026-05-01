---
author: Alexander Opalic
pubDatetime: 2025-04-01T00:00:00Z
title: "The Inline Vue Composables Refactoring pattern"
slug: inline-vue-composables-refactoring
description: "Learn how to apply Martin Fowler's Extract Function pattern to Vue components using inline composables, making your code cleaner and more maintainable."
tags: ["vue", "refactoring"]
draft: false
---

## TLDR

Improve your Vue component organization by using inline composables - a technique inspired by Martin Fowler's Extract Function pattern. By grouping related logic into well-named functions within your components, you can make your code more readable and maintainable without the overhead of creating separate files.

## Introduction

Vue 3 gives us powerful tools through the Composition API and `<script setup>`. But that power can lead to cluttered components full of mixed concerns: queries, state, side effects, and logic all tangled together.

For better clarity, we'll apply an effective refactoring technique: **Extract Function**. Michael Thiessen was the first to give this Vue-specific implementation a name - "inline composables" - in his blog post at [michaelnthiessen.com/inline-composables](https://michaelnthiessen.com/inline-composables), bridging the gap between Martin Fowler's classic pattern and modern Vue development.

This isn't a new idea. It comes from Martin Fowler's _Refactoring_ catalog, where he describes it as a way to break large functions into smaller ones with descriptive names. You can see the technique explained on his site here:  
[refactoring.com/catalog/extractFunction.html](https://refactoring.com/catalog/extractFunction.html)

Here's his example:

```ts
function printOwing(invoice) {
  printBanner();
  let outstanding = calculateOutstanding();

  // print details
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
}
```

This code works, but lacks clarity. We can improve it by extracting the details-printing part into its own function:

```ts
function printOwing(invoice) {
  printBanner();
  let outstanding = calculateOutstanding();
  printDetails(outstanding);

  function printDetails(outstanding) {
    console.log(`name: ${invoice.customer}`);
    console.log(`amount: ${outstanding}`);
  }
}
```

Now the top-level function reads more like a story. This small change makes the code easier to understand and easier to maintain.

## Bringing Extract Function to Vue

We can apply the same principle inside Vue components using what we call **inline composables**. These are small functions declared inside your `<script setup>` block that handle a specific piece of logic.

Let's look at an example based on a [gist from Evan You](https://gist.github.com/yyx990803/8854f8f6a97631576c14b63c8acd8f2e).

### Before Refactoring

Here's how a Vue component might look before introducing inline composables. All the logic is in one place:

```ts
// src/components/FolderManager.vue
<script setup>
import { ref, watch } from 'vue'

async function toggleFavorite(currentFolderData) {
  await mutate({
    mutation: FOLDER_SET_FAVORITE,
    variables: {
      path: currentFolderData.path,
      favorite: !currentFolderData.favorite
    }
  })
}

const showHiddenFolders = ref(localStorage.getItem('vue-ui.show-hidden-folders') === 'true')

const favoriteFolders = useQuery(FOLDERS_FAVORITE, [])

watch(showHiddenFolders, (value) => {
  if (value) {
    localStorage.setItem('vue-ui.show-hidden-folders', 'true')
  } else {
    localStorage.removeItem('vue-ui.show-hidden-folders')
  }
})

</script>
```

It works, but the logic is mixed together, and it's hard to tell what this component does without reading all the details.

### After Refactoring with Inline Composables

Now let's apply Extract Function inside Vue. We'll group logic into focused composables:

```ts
// src/components/FolderManager.vue
<script setup>
import { ref, watch } from 'vue'
import { useQuery, mutate } from 'vue-apollo'
import FOLDERS_FAVORITE from '@/graphql/folder/favoriteFolders.gql'
import FOLDER_SET_FAVORITE from '@/graphql/folder/folderSetFavorite.gql'

const { showHiddenFolders } = useHiddenFolders()
const { favoriteFolders, toggleFavorite } = useFavoriteFolders()

function useHiddenFolders() {
  const showHiddenFolders = ref(localStorage.getItem('vue-ui.show-hidden-folders') === 'true')

  watch(showHiddenFolders, (value) => {
    if (value) {
      localStorage.setItem('vue-ui.show-hidden-folders', 'true')
    } else {
      localStorage.removeItem('vue-ui.show-hidden-folders')
    }
  }, { lazy: true })

  return { showHiddenFolders }
}

function useFavoriteFolders() {
  const favoriteFolders = useQuery(FOLDERS_FAVORITE, [])

  async function toggleFavorite(currentFolderData) {
    await mutate({
      mutation: FOLDER_SET_FAVORITE,
      variables: {
        path: currentFolderData.path,
        favorite: !currentFolderData.favorite
      }
    })
  }

  return {
    favoriteFolders,
    toggleFavorite
  }
}
</script>
```

Now the logic is clean and separated. When someone reads this component, they can understand the responsibilities at a glance:

```ts
const { showHiddenFolders } = useHiddenFolders();
const { favoriteFolders, toggleFavorite } = useFavoriteFolders();
```

Each piece of logic has a descriptive name, with implementation details encapsulated in their own functions, following the Extract Function pattern.

## Best Practices

- Use inline composables when your `<script setup>` is getting hard to read
- Group related state, watchers, and async logic by responsibility
- Give composables clear, descriptive names that explain their purpose
- Keep composables focused on a single concern
- Consider moving composables to separate files if they become reusable across components

## When to Use Inline Composables

- Your component contains related pieces of state and logic
- The logic is specific to this component and not ready for sharing
- You want to improve readability without creating new files
- You need to organize complex component logic without over-engineering

## Conclusion

The inline composable technique in Vue is a natural extension of Martin Fowler's **Extract Function**. Here's what you get:

- Cleaner, more organized component code
- Better separation of concerns
- Improved readability and maintainability
- A stepping stone towards reusable composables

Try using inline composables in your next Vue component. It's one of those small refactors that will make your code better without making your life harder.

You can see the full example in Evan You's gist here:  
[https://gist.github.com/yyx990803/8854f8f6a97631576c14b63c8acd8f2e](https://gist.github.com/yyx990803/8854f8f6a97631576c14b63c8acd8f2e)
