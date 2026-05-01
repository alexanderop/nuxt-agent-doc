---
author: Alexander Opalic
pubDatetime: 2025-04-03T00:00:00Z
title: "The Computed Inlining Refactoring Pattern in Vue"
slug: computed-inlining-refactoring-pattern-in-vue
description: "Learn how to improve Vue component performance and readability by applying the Computed Inlining pattern - a technique inspired by Martin Fowler's Inline Function pattern."
tags: ["vue", "refactoring"]
draft: false
---

## TLDR

Improve your Vue component performance and readability by applying the Computed Inlining pattern - a technique inspired by Martin Fowler's Inline Function pattern. By consolidating helper functions directly into computed properties, you can reduce unnecessary abstractions and function calls, making your code more straightforward and efficient.

## Introduction

Vue 3's reactivity system is powered by computed properties that efficiently update only when their dependencies change. But sometimes we overcomplicate our components by creating too many small helper functions that only serve a single computed property. This creates unnecessary indirection and can make code harder to follow.

The Computed Inlining pattern addresses this problem by consolidating these helper functions directly into the computed properties that use them. This pattern is the inverse of Martin Fowler's Extract Function pattern and is particularly powerful in the context of Vue's reactive system.

## Understanding Inline Function

This pattern comes from Martin Fowler's Refactoring catalog, where he describes it as a way to simplify code by removing unnecessary function calls when the function body is just as clear as its name. You can see his original pattern here: [refactoring.com/catalog/inlineFunction.html](https://refactoring.com/catalog/inlineFunction.html)

Here's his example:

```javascript
function getRating(driver) {
  return moreThanFiveLateDeliveries(driver) ? 2 : 1;
}

function moreThanFiveLateDeliveries(driver) {
  return driver.numberOfLateDeliveries > 5;
}
```

After applying the Inline Function pattern:

```javascript
function getRating(driver) {
  return driver.numberOfLateDeliveries > 5 ? 2 : 1;
}
```

The code becomes more direct and eliminates an unnecessary function call, while maintaining readability.

## Bringing Inline Function to Vue Computed Properties

In Vue components, we often create helper functions that are only used once inside a computed property. While these can improve readability in complex cases, they can also add unnecessary layers of abstraction when the logic is simple.

Let's look at how this pattern applies specifically to computed properties in Vue.

### Before Refactoring

Here's how a Vue component might look before applying Computed Inlining:

```vue
// src/components/OrderSummary.vue
<script setup lang="ts">
import { computed, ref, watch } from "vue";

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  isDiscounted: boolean;
}

const orderItems = ref<OrderItem[]>([
  { id: 1, quantity: 2, unitPrice: 100, isDiscounted: true },
  { id: 2, quantity: 1, unitPrice: 50, isDiscounted: false },
]);

const taxRate = ref(0.1);
const discountRate = ref(0.15);
const shippingCost = ref(15);
const freeShippingThreshold = ref(200);

// Helper function to calculate item total
function calculateItemTotal(item: OrderItem): number {
  if (item.isDiscounted) {
    return item.quantity * item.unitPrice * (1 - discountRate.value);
  }
  return item.quantity * item.unitPrice;
}

// Helper function to sum all items
function calculateSubtotal(): number {
  return orderItems.value.reduce((sum, item) => {
    return sum + calculateItemTotal(item);
  }, 0);
}

// Helper function to determine shipping
function getShippingCost(subtotal: number): number {
  return subtotal > freeShippingThreshold.value ? 0 : shippingCost.value;
}

// Computed property for subtotal
const subtotal = computed(() => {
  return calculateSubtotal();
});

// Computed property for tax
const tax = computed(() => {
  return subtotal.value * taxRate.value;
});

// Watch for changes to update final total
const finalTotal = ref(0);
watch(
  [subtotal, tax],
  ([newSubtotal, newTax]) => {
    const shipping = getShippingCost(newSubtotal);
    finalTotal.value = newSubtotal + newTax + shipping;
  },
  { immediate: true }
);
</script>
```

The component works but has several issues:

- Uses a watch when a computed would be more appropriate
- Has multiple helper functions that are only used once
- Splits related logic across different properties and functions
- Creates unnecessary intermediate values

### After Refactoring with Computed Inlining

Now let's apply Computed Inlining to simplify the code:

```vue
// src/components/OrderSummary.vue
<script setup lang="ts">
import { computed, ref } from "vue";

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  isDiscounted: boolean;
}

const orderItems = ref<OrderItem[]>([
  { id: 1, quantity: 2, unitPrice: 100, isDiscounted: true },
  { id: 2, quantity: 1, unitPrice: 50, isDiscounted: false },
]);

const taxRate = ref(0.1);
const discountRate = ref(0.15);
const shippingCost = ref(15);
const freeShippingThreshold = ref(200);

const orderTotal = computed(() => {
  // Calculate subtotal with inline discount logic
  const subtotal = orderItems.value.reduce((sum, item) => {
    const itemTotal = item.isDiscounted
      ? item.quantity * item.unitPrice * (1 - discountRate.value)
      : item.quantity * item.unitPrice;
    return sum + itemTotal;
  }, 0);

  // Calculate tax
  const tax = subtotal * taxRate.value;

  // Determine shipping cost inline
  const shipping =
    subtotal > freeShippingThreshold.value ? 0 : shippingCost.value;

  return subtotal + tax + shipping;
});
</script>
```

The refactored version:

- Consolidates all pricing logic into a single computed property
- Eliminates the need for a watch by using Vue's reactive system properly
- Removes unnecessary helper functions and intermediate values
- Makes the data flow more clear and direct
- Reduces the number of reactive dependencies being tracked

## Best Practices

- Apply Computed Inlining when the helper function is only used once
- Use this pattern when the logic is simple enough to be understood inline
- Add comments to clarify steps if the inline logic is non-trivial
- Keep computed properties focused on a single responsibility, even after inlining
- Consider keeping functions separate if they're reused or complex

## When to Use Computed Inlining

- When the helper functions are only used by a single computed property
- When performance is critical (eliminates function call overhead)
- When the helper functions don't significantly improve readability
- When you want to reduce the cognitive load of jumping between functions
- When debugging and following the execution flow is important

## When to Avoid Computed Inlining

- When the helper function is used in multiple places
- When the logic is complex and the function name significantly improves clarity
- When the function might need to be reused in the future
- When testing the helper function independently is important

## Conclusion

The Computed Inlining pattern in Vue is a practical application of Martin Fowler's Inline Function refactoring technique. It helps streamline your reactive code by:

- Reducing unnecessary abstractions
- Eliminating function call overhead
- Making execution flow more direct and easier to follow
- Keeping related logic together in one place

While not appropriate for every situation, Computed Inlining is a valuable tool in your Vue refactoring toolkit, especially when optimizing components with many small helper functions.

Try applying Computed Inlining in your next Vue component refactoring, and see how it can make your code both simpler and more efficient.

## References

- [Martin Fowler's Inline Function Pattern](https://refactoring.com/catalog/inlineFunction.html)
- [Vue Documentation on Computed Properties](https://vuejs.org/guide/essentials/computed.html)
