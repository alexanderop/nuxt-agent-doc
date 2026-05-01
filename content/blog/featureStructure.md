---
author: Alexander Opalic
pubDatetime: 2024-10-19T09:00:00.000+02:00
modDatetime: 2024-10-19T09:00:00.000+02:00
title: "Evolving Your Vue 3 Project Structure: From Flat to Feature-Based"
draft: true
tags:
  - vue
  - project-structure
  - architecture
  - scalability
seriesTag: vue-architecture
seriesTitle: "Vue Architecture Guide"
description: Learn how to evolve your Vue 3 project structure from a simple flat layout to a scalable feature-based architecture as your application grows in complexity.
---

# Evolving Your Vue 3 Project Structure: From Flat to Feature-Based

As Vue 3 projects grow in complexity, the way you organize your code becomes increasingly important. But not all projects need the same level of structure from the start. In this post, we'll explore how to evolve your Vue 3 project structure as it grows, from a simple flat structure to a more complex feature-based organization. We'll also look at how to incorporate modern Vue 3 practices like Pinia for state management and composables for reusable logic.

## The Evolution of Project Structure

### Step 1: Flat Structure

For small to medium-sized applications, a flat structure can be sufficient and easy to navigate. Here's what a flat structure might look like:

```
src/
|-- components/
|   |-- Header.vue
|   |-- Footer.vue
|   |-- ProductList.vue
|   |-- CartSummary.vue
|-- views/
|   |-- Home.vue
|   |-- Product.vue
|   |-- Cart.vue
|-- App.vue
|-- main.js
|-- router.js
```

In this structure, all components are in a single folder, and all views (pages) are in another. This works well when you have a limited number of files and the relationships between them are straightforward.

### Step 2: Technical Structure

As your application grows, you might find it beneficial to separate concerns based on their technical role. This might look like:

```
src/
|-- components/
|   |-- Header.vue
|   |-- Footer.vue
|   |-- ProductList.vue
|   |-- CartSummary.vue
|-- views/
|   |-- Home.vue
|   |-- Product.vue
|   |-- Cart.vue
|-- composables/
|   |-- useProductSearch.js
|   |-- useCart.js
|-- stores/
|   |-- product.js
|   |-- cart.js
|-- utils/
|   |-- formatCurrency.js
|   |-- validateEmail.js
|-- services/
|   |-- api.js
|-- App.vue
|-- main.js
|-- router.js
```

This structure separates code based on its technical role in the application. Composables, stores (using Pinia), utilities, and services each have their own directory. This organization can make it easier to find and manage different types of code.

### Step 3: Feature-Based Structure

For large applications, especially those worked on by multiple teams, a feature-based structure can be beneficial. This approach, which aligns with the concept of a modular monolith, might look like this:

```
src/
|-- features/
|   |-- product/
|   |   |-- components/
|   |   |   |-- ProductList.vue
|   |   |   |-- ProductItem.vue
|   |   |-- composables/
|   |   |   |-- useProductSearch.js
|   |   |-- stores/
|   |   |   |-- productStore.js
|   |   |-- services/
|   |   |   |-- productApi.js
|   |   |-- views/
|   |   |   |-- ProductPage.vue
|   |-- cart/
|   |   |-- components/
|   |   |-- composables/
|   |   |-- stores/
|   |   |-- services/
|   |   |-- views/
|-- components/  # Shared components
|-- composables/  # Shared composables
|-- stores/  # Shared stores
|-- utils/  # Shared utilities
|-- services/  # Shared services
|-- App.vue
|-- main.js
|-- router.js
```

In this structure, each major feature of the application has its own directory, containing all the components, composables, stores, and services related to that feature. Shared or global elements remain in the root `src/` directory.

## Implementing the Feature-Based Structure

Let's look at how you might implement the product feature using Vue 3, Pinia, and composables:

`features/product/stores/productStore.js`:

```javascript
import { defineStore } from "pinia";
import { ref } from "vue";
import { productApi } from "../services/productApi";

export const useProductStore = defineStore("product", () => {
  const products = ref([]);

  const getProducts = async () => {
    products.value = await productApi.getAll();
  };

  return { products, getProducts };
});
```

`features/product/composables/useProductSearch.js`:

```javascript
import { ref, computed } from "vue";
import { useProductStore } from "../stores/productStore";

export function useProductSearch() {
  const store = useProductStore();
  const searchTerm = ref("");

  const filteredProducts = computed(() => {
    return store.products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    );
  });

  return {
    searchTerm,
    filteredProducts,
  };
}
```

`features/product/components/ProductList.vue`:

```js
<template>
  <div>
    <input v-model="searchTerm" placeholder="Search products..." />
    <product-item v-for="product in filteredProducts" :key="product.id" :product="product" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useProductStore } from '../stores/productStore'
import { useProductSearch } from '../composables/useProductSearch'
import ProductItem from './ProductItem.vue'

const store = useProductStore()
const { searchTerm, filteredProducts } = useProductSearch()

onMounted(() => {
  store.getProducts()
})
</script>
```

## The Feature-Based Approach and the Modular Monolith

The feature-based structure aligns closely with the concept of a "modular monolith" in software architecture. A modular monolith is a single application (monolith) that's internally separated into independent modules (modular).

### How It Works

1. **Single Application**: The entire Vue app is deployed as a single unit.
2. **Independent Modules**: Each feature in the `features/` directory acts as an independent module.
3. **Clear Boundaries**: Features have their own components, stores, and services, creating clear boundaries.
4. **Loose Coupling**: Organizing code by feature and using composables for shared logic promotes loose coupling.
5. **High Cohesion**: Related functionality is grouped together within each feature.

### Benefits

1. **Simplified Development**: Developers can work on individual features without affecting others.
2. **Easier Maintenance**: When issues arise, it's clear which feature to investigate.
3. **Scalability**: New features can be added as new modules without disrupting existing code.
4. **Potential for Future Microservices**: Features can be more easily extracted into separate microservices if needed.
5. **Balance**: It provides a balance between the simplicity of a monolith and the flexibility of a more distributed architecture.

## Choosing the Right Structure

The structure you choose should depend on the size and complexity of your project:

1. **Small Projects**: Start with a flat structure. It's simple and easy to manage for small teams and projects.
2. **Growing Projects**: As your project grows, consider moving to a technical structure. This helps organize code by its role in the application.
3. **Large Projects**: For large, complex applications or those worked on by multiple teams, consider a feature-based structure. This provides clear boundaries and can help manage complexity.

Remember, these structures are not set in stone. You can and should adapt them to fit the specific needs of your project and team. The goal is to create an organization that makes development efficient and enjoyable.

## Conclusion

As your Vue 3 project grows, your project structure should evolve with it. Starting with a simple flat structure, moving to a technical structure as complexity increases, and finally adopting a feature-based structure for large applications can help keep your codebase manageable and maintainable.

The feature-based structure, when combined with Vue 3's Composition API, Pinia for state management, and composables for reusable logic, creates a powerful, scalable architecture for your application. It allows your project to grow in complexity while remaining manageable and adaptable to future changes.

Remember, the key is to maintain clear boundaries between different parts of your application while allowing for shared functionality where it makes sense. By doing so, you'll create a Vue 3 application that's both powerful and maintainable, no matter how large it grows.
