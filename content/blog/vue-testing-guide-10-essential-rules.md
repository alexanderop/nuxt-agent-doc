---
author: Alexander Opalic
pubDatetime: 2024-10-26T10:00:00.000+02:00
title: "Frontend Testing Guide: 10 Essential Rules for Naming Tests"
slug: "frontend-testing-guide-10-essential-rules"
draft: false
tags:
  - testing
  - vitest
description: Learn how to write clear and maintainable frontend tests with 10 practical naming rules. Includes real-world examples showing good and bad practices for component testing across any framework.
---

## Introduction

The path to better testing starts with something surprisingly simple: how you name your tests. Good test names:

- Make your test suite more maintainable
- Guide you toward writing tests that focus on user behavior
- Improve clarity and readability for your team

In this blog post, we'll explore 10 essential rules for writing better tests that will transform your approach to testing. These principles are:

1. Framework-agnostic
2. Applicable across the entire testing pyramid
3. Useful for various testing tools:
   - Unit tests (Jest, Vitest)
   - Integration tests
   - End-to-end tests (Cypress, Playwright)

By following these rules, you'll create a more robust and understandable test suite, regardless of your chosen testing framework or methodology.

## Rule 1: Always Use "should" + Verb

Every test name should start with "should" followed by an action verb.

```js
// ❌ Bad
it("displays the error message", () => {});
it("modal visibility", () => {});
it("form validation working", () => {});

// ✅ Good
it("should display error message when validation fails", () => {});
it("should show modal when trigger button is clicked", () => {});
it("should validate form when user submits", () => {});
```

**Generic Pattern:** `should [verb] [expected outcome]`

## Rule 2: Include the Trigger Event

Specify what causes the behavior you're testing.

```js
// ❌ Bad
it("should update counter", () => {});
it("should validate email", () => {});
it("should show dropdown", () => {});

// ✅ Good
it("should increment counter when plus button is clicked", () => {});
it("should show error when email format is invalid", () => {});
it("should open dropdown when toggle is clicked", () => {});
```

**Generic Pattern:** `should [verb] [expected outcome] when [trigger event]`

## Rule 3: Group Related Tests with Descriptive Contexts

Use describe blocks to create clear test hierarchies.

```js
// ❌ Bad
describe("AuthForm", () => {
  it("should test empty state", () => {});
  it("should test invalid state", () => {});
  it("should test success state", () => {});
});

// ✅ Good
describe("AuthForm", () => {
  describe("when form is empty", () => {
    it("should disable submit button", () => {});
    it("should not show any validation errors", () => {});
  });

  describe("when submitting invalid data", () => {
    it("should show validation errors", () => {});
    it("should keep submit button disabled", () => {});
  });
});
```

**Generic Pattern:**

```js
describe("[Component/Feature]", () => {
  describe("when [specific condition]", () => {
    it("should [expected behavior]", () => {});
  });
});
```

## Rule 4: Name State Changes Explicitly

Clearly describe the before and after states in your test names.

```js
// ❌ Bad
it("should change status", () => {});
it("should update todo", () => {});
it("should modify permissions", () => {});

// ✅ Good
it("should change status from pending to approved", () => {});
it("should mark todo as completed when checkbox clicked", () => {});
it("should upgrade user from basic to premium", () => {});
```

**Generic Pattern:** `should change [attribute] from [initial state] to [final state]`

## Rule 5: Describe Async Behavior Clearly

Include loading and result states for asynchronous operations.

```js
// ❌ Bad
it("should load data", () => {});
it("should handle API call", () => {});
it("should fetch user", () => {});

// ✅ Good
it("should show skeleton while loading data", () => {});
it("should display error message when API call fails", () => {});
it("should render profile after user data loads", () => {});
```

**Generic Pattern:** `should [verb] [expected outcome] [during/after] [async operation]`

## Rule 6: Name Error Cases Specifically

Be explicit about the type of error and what causes it.

```js
// ❌ Bad
it("should show error", () => {});
it("should handle invalid input", () => {});
it("should validate form", () => {});

// ✅ Good
it('should show "Invalid Card" when card number is wrong', () => {});
it('should display "Required" when password is empty', () => {});
it("should show network error when API is unreachable", () => {});
```

**Generic Pattern:** `should show [specific error message] when [error condition]`

## Rule 7: Use Business Language, Not Technical Terms

Write tests using domain language rather than implementation details.

```js
// ❌ Bad
it("should update state", () => {});
it("should dispatch action", () => {});
it("should modify DOM", () => {});

// ✅ Good
it("should save customer order", () => {});
it("should update cart total", () => {});
it("should mark order as delivered", () => {});
```

**Generic Pattern:** `should [business action] [business entity]`

## Rule 8: Include Important Preconditions

Specify conditions that affect the behavior being tested.

```js
// ❌ Bad
it("should enable button", () => {});
it("should show message", () => {});
it("should apply discount", () => {});

// ✅ Good
it("should enable checkout when cart has items", () => {});
it("should show free shipping when total exceeds $100", () => {});
it("should apply discount when user is premium member", () => {});
```

**Generic Pattern:** `should [expected behavior] when [precondition]`

## Rule 9: Name UI Feedback Tests from User Perspective

Describe visual changes as users would perceive them.

```js
// ❌ Bad
it("should set error class", () => {});
it("should toggle visibility", () => {});
it("should update styles", () => {});

// ✅ Good
it("should highlight search box in red when empty", () => {});
it("should show green checkmark when password is strong", () => {});
it("should disable submit button while processing", () => {});
```

**Generic Pattern:** `should [visual change] when [user action/condition]`

## Rule 10: Structure Complex Workflows Step by Step

Break down complex processes into clear steps.

```js
// ❌ Bad
describe("Checkout", () => {
  it("should process checkout", () => {});
  it("should handle shipping", () => {});
  it("should complete order", () => {});
});

// ✅ Good
describe("Checkout Process", () => {
  it("should first validate items are in stock", () => {});
  it("should then collect shipping address", () => {});
  it("should finally process payment", () => {});

  describe("after successful payment", () => {
    it("should display order confirmation", () => {});
    it("should send confirmation email", () => {});
  });
});
```

**Generic Pattern:**

```js
describe("[Complex Process]", () => {
  it("should first [initial step]", () => {});
  it("should then [next step]", () => {});
  it("should finally [final step]", () => {});

  describe("after [key milestone]", () => {
    it("should [follow-up action]", () => {});
  });
});
```

## Complete Example

Here's a comprehensive example showing how to combine all these rules:

```js
// ❌ Bad
describe("ShoppingCart", () => {
  it("test adding item", () => {});
  it("check total", () => {});
  it("handle checkout", () => {});
});

// ✅ Good
describe("ShoppingCart", () => {
  describe("when adding items", () => {
    it("should add item to cart when add button is clicked", () => {});
    it("should update total price immediately", () => {});
    it("should show item count badge", () => {});
  });

  describe("when cart is empty", () => {
    it("should display empty cart message", () => {});
    it("should disable checkout button", () => {});
  });

  describe("during checkout process", () => {
    it("should validate stock before proceeding", () => {});
    it("should show loading indicator while processing payment", () => {});
    it("should display success message after completion", () => {});
  });
});
```

## Test Name Checklist

Before committing your test, verify that its name:

- [ ] Starts with "should"
- [ ] Uses a clear action verb
- [ ] Specifies the trigger condition
- [ ] Uses business language
- [ ] Describes visible behavior
- [ ] Is specific enough for debugging
- [ ] Groups logically with related tests

## Conclusion

Thoughtful test naming is a fundamental building block in the broader landscape of writing better tests. To maintain consistency across your team:

1. Document your naming conventions in detail
2. Share these guidelines with all team members
3. Integrate the guidelines into your development workflow

For teams using AI tools like GitHub Copilot:

- Incorporate these guidelines into your project documentation
- Link the markdown file containing these rules to Copilot
- This integration allows Copilot to suggest test names aligned with your conventions

For more information on linking documentation to Copilot, see:
[VS Code Experiments Boost AI Copilot Functionality](https://visualstudiomagazine.com/Articles/2024/09/09/VS-Code-Experiments-Boost-AI-Copilot-Functionality.aspx)

By following these steps, you can ensure consistent, high-quality test naming across your entire project.
