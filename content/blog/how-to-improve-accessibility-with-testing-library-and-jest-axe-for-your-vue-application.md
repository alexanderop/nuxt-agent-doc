---
author: Alexander Opalic
pubDatetime: 2023-04-12T15:22:00Z
modDatetime: 2024-09-29T15:22:00Z
title: "How to Improve Accessibility with Testing Library and jest-axe for Your Vue Application"
slug: how-to-improve-accessibility-with-testing-library-and-jest-axe-for-your-vue-application
draft: false
tags:
  - vue
  - accessibility
description: "Use Jest axe to have automatic tests for your vue application"
---

Accessibility is a critical aspect of web development that ensures your application serves everyone, including people with disabilities. Making your Vue apps accessible fulfills legal requirements and enhances the experience for all users. In this post, we'll explore how to improve accessibility in Vue applications using Testing Library and jest-axe.

## Prerequisites

Before we dive in, make sure you have the following installed in your Vue project:

- @testing-library/vue
- jest-axe

You can add them with:

```bash
npm install --save-dev @testing-library/vue jest-axe
```

## Example Component

Let's look at a simple Vue component that displays an image and some text:

```vue
<template>
  <div>
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <img src="sample_image.jpg" />
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: String,
  description: String,
});
</script>
```

Developers should include alt text for images to ensure accessibility, but how can we verify this in production?

## Testing with jest-axe

This is where jest-axe comes in. Axe is a leading accessibility testing toolkit used by major tech companies.

To test our component, we can create a test file like this:

```js
import { render } from "@testing-library/vue";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, it, expect } from "vitest";
import MyComponent from "./MyComponent.vue";

expect.extend(toHaveNoViolations);

describe("MyComponent", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(MyComponent, {
      props: {
        title: "Sample Title",
        description: "Sample Description",
      },
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

When we run this test, we'll get an error like:

```shell
FAIL  src/components/MyComponent.spec.ts > MyComponent > has no accessibility violations

Error: expect(received).toHaveNoViolations(expected)

Expected the HTML found at $('img') to have no violations:

<img src="sample_image.jpg">

Received:

"Images must have alternate text (image-alt)"

Fix any of the following:
  Element does not have an alt attribute
  aria-label attribute does not exist or is empty
  aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
  Element has no title attribute
  Element's default semantics were not overridden with role="none" or role="presentation"
```

This tells us we need to add an alt attribute to our image. We can fix the component and re-run the test until it passes.

## Conclusion

By integrating accessibility testing with tools like Testing Library and jest-axe, we catch accessibility issues during development. This ensures our Vue applications remain usable for everyone. Making accessibility testing part of our CI pipeline maintains high standards and delivers a better experience for all users.
