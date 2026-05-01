---
author: Alexander Opalic
pubDatetime: 2026-01-31T00:00:00Z
title: "My Opinionated ESLint Setup for Vue Projects"
description: "A battle-tested linting configuration that catches real bugs, enforces clean architecture, and runs fast using Oxlint and ESLint together."
tags: ["vue", "typescript", "tooling", "architecture"]
draft: false
---

Over the last 7+ years as a Vue developer, I've developed a highly opinionated style for writing Vue components. Some of these rules might not be useful for you, but I thought it was worth sharing so you can pick what fits your project. The goal is to enforce code structure that's readable for both developers and AI agents.

These rules aren't arbitrary—they encode patterns I've written about extensively:

- [How to Write Clean Vue Components](/blog/how-to-write-clean-vue-components) explains why I separate business logic into pure functions
- [How to Structure Vue Projects](/blog/how-to-structure-vue-projects) covers my feature-based architecture approach
- [Building a Modular Monolith with Nuxt Layers](/blog/nuxt-layers-modular-monolith) applies feature isolation to Nuxt projects
- [The Problem with `as` in TypeScript](/blog/the-problem-with-as-in-typescript-why-its-a-shortcut-we-should-avoid) covers why I ban type assertions
- [Robust Error Handling in TypeScript](/blog/robust-error-handling-in-typescript-a-journey-from-naive-to-rust-inspired-solutions) introduces the Result pattern behind my `tryCatch` rule
- [Vue 3 Testing Pyramid](/blog/vue3_testing_pyramid_vitest_browser_mode) explains my integration-first testing strategy
- [Frontend Testing Guide](/blog/frontend-testing-guide-10-essential-rules) shares my test naming conventions

ESLint rules are how I enforce these patterns automatically—so the codebase stays consistent even as the team grows.

> 
**Why linting matters more in the AI era:** As AI agents write more of our code, strict linting becomes essential. It's a form of [back pressure](https://banay.me/dont-waste-your-backpressure/?ref=ghuntley.com)—automated feedback mechanisms that tell an agent when it's made a mistake, allowing it to self-correct without your intervention. You have a limited budget of feedback (your time and attention). If you spend that budget telling the agent "you missed an import" or "that type is wrong," you can't spend it on architectural decisions or complex logic. Type checkers, linters, and test suites act as back pressure: they push back against bad code so you don't have to. Your ESLint config is now part of your prompt—it's the automated quality gate that lets agents iterate until they pass.

## Table of Contents

## Why Two Linters? Oxlint + ESLint

I run two linters: **Oxlint** first, then **ESLint**. Why? Speed and coverage.

### Oxlint: The Speed Demon

[Oxlint](https://oxc.rs/docs/guide/usage/linter.html) is written in Rust. It runs 50-100x faster than ESLint on large codebases. My pre-commit hook completes in milliseconds instead of seconds.

```bash
# In package.json
"lint:oxlint": "oxlint . --fix --ignore-path .gitignore",
"lint:eslint": "eslint . --fix --cache",
"lint": "run-s lint:*"  # Runs oxlint first, then eslint
```

**The tradeoff:** Oxlint supports fewer rules. It handles:
- **Correctness & suspicious patterns** - catches bugs early
- **Core ESLint equivalents** - `no-console`, `no-explicit-any`
- **TypeScript basics** - `array-type`, `consistent-type-definitions`

But Oxlint lacks:
- Vue-specific rules (`vue/*`)
- Import boundary rules (`import-x/*`)
- Vitest testing rules (`vitest/*`)
- i18n rules (`@intlify/vue-i18n/*`)
- Custom local rules

### The Setup

Oxlint runs first for fast feedback. ESLint runs second for comprehensive checks. The `eslint-plugin-oxlint` package tells ESLint to skip rules that Oxlint already handles.

```typescript
// eslint.config.ts
import pluginOxlint from 'eslint-plugin-oxlint'

export default defineConfigWithVueTs(
  // ... other configs
  ...pluginOxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
)
```

```json
// .oxlintrc.json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "categories": {
    "correctness": "error",
    "suspicious": "warn"
  },
  "rules": {
    "typescript/no-explicit-any": "error",
    "eslint/no-console": ["error", { "allow": ["warn", "error"] }]
  }
}
```

---

## Must-Have Rules

These rules catch real bugs and enforce maintainable code. Enable them on every Vue project.

---

### Cyclomatic Complexity

Complex functions are hard to test and understand. This rule limits branching logic per function.

```typescript
// eslint.config.ts
{
  rules: {
    'complexity': ['warn', { max: 10 }]
  }
}
```

  
```typescript
function processOrder(order: Order) {
  if (order.status === 'pending') {
    if (order.items.length > 0) {
      if (order.payment) {
        if (order.payment.verified) {
          if (order.shipping) {
            // 5 levels deep, complexity keeps growing...
          }
        }
      }
    }
  }
}
```
  
  
```typescript
function processOrder(order: Order) {
  if (!isValidOrder(order)) return

  processPayment(order.payment)
  scheduleShipping(order.shipping)
}

function isValidOrder(order: Order): boolean {
  return order.status === 'pending'
    && order.items.length > 0
    && order.payment?.verified === true
}
```
  

**Threshold guidance:**
- ESLint default: `20` (lenient)
- This project uses: `10` (stricter)
- Consider `15` as a middle ground for legacy codebases

> [ESLint: complexity](https://eslint.org/docs/latest/rules/complexity)

---

### No Nested Ternaries

Nested ternaries are hard to read. Use early returns or separate variables instead.

```typescript
// eslint.config.ts
{
  rules: {
    'no-nested-ternary': 'error'
  }
}
```

  
```typescript
const label = isLoading ? 'Loading...' : hasError ? 'Failed' : 'Success'
```
  
  
```typescript
function getLabel() {
  if (isLoading) return 'Loading...'
  if (hasError) return 'Failed'
  return 'Success'
}

const label = getLabel()
```
  

> [ESLint: no-nested-ternary](https://eslint.org/docs/rules/no-nested-ternary)

---

### No Type Assertions

Type assertions (`as Type`) bypass TypeScript's type checker. They hide bugs. Use type guards or proper typing instead.

```typescript
// eslint.config.ts
{
  rules: {
    '@typescript-eslint/consistent-type-assertions': ['error', {
      assertionStyle: 'never'
    }]
  }
}
```

> 
`as const` assertions are always allowed, even with `assertionStyle: 'never'`. Const assertions don't bypass type checking—they make types more specific.

  
```typescript
const user = response.data as User  // What if it's not a User?

const element = document.querySelector('.btn') as HTMLButtonElement
element.click()  // Runtime error if element is null
```
  
  
```typescript
// Use type guards
function isUser(data: unknown): data is User {
  return typeof data === 'object'
    && data !== null
    && 'id' in data
    && 'name' in data
}

if (isUser(response.data)) {
  const user = response.data  // TypeScript knows it's User
}

// Handle nulls properly
const element = document.querySelector('.btn')
if (element instanceof HTMLButtonElement) {
  element.click()
}
```
  

> [TypeScript ESLint: consistent-type-assertions](https://typescript-eslint.io/rules/consistent-type-assertions)

---

### No Enums

TypeScript enums have quirks. They generate JavaScript code, have numeric reverse mappings, and behave differently from union types. Use literal unions or const objects instead.

```typescript
// eslint.config.ts
{
  rules: {
    'no-restricted-syntax': ['error', {
      selector: 'TSEnumDeclaration',
      message: 'Use literal unions or `as const` objects instead of enums.'
    }]
  }
}
```

  
```typescript
enum Status {
  Pending,
  Active,
  Done
}

const status: Status = Status.Pending
```
  
  
```typescript
// Literal union - simplest
type Status = 'pending' | 'active' | 'done'

// Or const object when you need values
const Status = {
  Pending: 'pending',
  Active: 'active',
  Done: 'done'
} as const

type Status = typeof Status[keyof typeof Status]
```
  

> [ESLint: no-restricted-syntax](https://eslint.org/docs/rules/no-restricted-syntax)

---

### No else/else-if

`else` and `else-if` blocks increase nesting. Early returns are easier to read and reduce cognitive load.

```typescript
// eslint.config.ts
{
  rules: {
    'no-restricted-syntax': ['error',
      {
        selector: 'IfStatement > IfStatement.alternate',
        message: 'Avoid `else if`. Prefer early returns or ternary operators.'
      },
      {
        selector: 'IfStatement > :not(IfStatement).alternate',
        message: 'Avoid `else`. Prefer early returns or ternary operators.'
      }
    ]
  }
}
```

  
```typescript
function getDiscount(user: User) {
  if (user.isPremium) {
    return 0.2
  } else if (user.isMember) {
    return 0.1
  } else {
    return 0
  }
}
```
  
  
```typescript
function getDiscount(user: User) {
  if (user.isPremium) return 0.2
  if (user.isMember) return 0.1
  return 0
}
```
  

> [ESLint: no-restricted-syntax](https://eslint.org/docs/rules/no-restricted-syntax)

---

### No Native try/catch

Native try/catch blocks are verbose and error-prone. Use a utility function that returns a result tuple instead.

```typescript
// eslint.config.ts
{
  rules: {
    'no-restricted-syntax': ['error', {
      selector: 'TryStatement',
      message: 'Use tryCatch() from @/lib/tryCatch instead of try/catch. Returns Result<T> tuple: [error, null] | [null, data].'
    }]
  }
}
```

  
```typescript
async function fetchUser(id: string) {
  try {
    const response = await api.get(`/users/${id}`)
    return response.data
  } catch (error) {
    console.error(error)
    return null
  }
}
```
  
  
```typescript
async function fetchUser(id: string) {
  const [error, response] = await tryCatch(api.get(`/users/${id}`))

  if (error) {
    console.error(error)
    return null
  }

  return response.data
}
```
  

The `tryCatch` utility returns `[error, null]` or `[null, data]`, similar to Go's error handling.

> [ESLint: no-restricted-syntax](https://eslint.org/docs/rules/no-restricted-syntax)

---

### No Direct DOM Manipulation

Vue manages the DOM. Calling `document.querySelector` bypasses Vue's reactivity and template refs. Use `useTemplateRef()` instead. If you're on Vue 3.5+, the built-in rule already enforces this.

```typescript
// eslint.config.ts
{
  files: ['src/**/*.vue'],
  rules: {
    'vue/prefer-use-template-ref': 'error'
  }
}
```

  
```vue
<script setup lang="ts">
function focusInput() {
  const input = document.getElementById('my-input')
  input?.focus()
}
</script>

<template>
  <input id="my-input" />
</template>
```
  
  
```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'

const inputRef = useTemplateRef<HTMLInputElement>('input')

function focusInput() {
  inputRef.value?.focus()
}
</script>

<template>
  <input ref="input" />
</template>
```
  

> [ESLint: no-restricted-syntax](https://eslint.org/docs/rules/no-restricted-syntax)

---

### Feature Boundary Enforcement

Features should not import from other features. This keeps code modular and prevents circular dependencies. If you're using a feature-based architecture, this rule is essential—see [How to Structure Vue Projects](/blog/how-to-structure-vue-projects) for more on this approach.

```typescript
// eslint.config.ts
{
  plugins: { 'import-x': pluginImportX },
  rules: {
    'import-x/no-restricted-paths': ['error', {
      zones: [
        // === CROSS-FEATURE ISOLATION ===
        // Features cannot import from other features
        { target: './src/features/workout', from: './src/features', except: ['./workout'] },
        { target: './src/features/exercises', from: './src/features', except: ['./exercises'] },
        { target: './src/features/settings', from: './src/features', except: ['./settings'] },
        { target: './src/features/timers', from: './src/features', except: ['./timers'] },
        { target: './src/features/templates', from: './src/features', except: ['./templates'] },
        { target: './src/features/benchmarks', from: './src/features', except: ['./benchmarks'] },

        // === UNIDIRECTIONAL FLOW ===
        // Shared code cannot import from features or views
        {
          target: ['./src/components', './src/composables', './src/lib', './src/db', './src/types', './src/stores'],
          from: ['./src/features', './src/views']
        },

        // Features cannot import from views (views are top-level orchestrators)
        { target: './src/features', from: './src/views' }
      ]
    }]
  }
}
```

**Unidirectional Flow:** The architecture enforces a strict dependency hierarchy. Views orchestrate features, features use shared code, but never the reverse.

```
views → features → shared (components, composables, lib, db, types, stores)
```

  
```typescript
// src/features/workout/composables/useWorkout.ts
import { useExerciseData } from '@/features/exercises/composables/useExerciseData'
// Cross-feature import!
```
  
  
```typescript
// src/features/workout/composables/useWorkout.ts
import { ExerciseRepository } from '@/db/repositories/ExerciseRepository'
// Use shared database layer instead
```
  

> [eslint-plugin-import-x: no-restricted-paths](https://github.com/un-ts/eslint-plugin-import-x)

---

### Vue Component Naming

Consistent naming makes components easy to find and identify.

```typescript
// eslint.config.ts
{
  files: ['src/**/*.vue'],
  rules: {
    'vue/multi-word-component-names': ['error', {
      ignores: ['App', 'Layout']
    }],
    'vue/component-definition-name-casing': ['error', 'PascalCase'],
    'vue/component-name-in-template-casing': ['error', 'PascalCase', {
      registeredComponentsOnly: false
    }],
    'vue/match-component-file-name': ['error', {
      extensions: ['vue'],
      shouldMatchCase: true
    }],
    'vue/prop-name-casing': ['error', 'camelCase'],
    'vue/attribute-hyphenation': ['error', 'always'],
    'vue/custom-event-name-casing': ['error', 'kebab-case']
  }
}
```

  
```vue
<!-- File: button.vue -->
<template>
  <base-button>Click</base-button>
</template>
```
  
  
```vue
<!-- File: SubmitButton.vue -->
<template>
  <BaseButton>Click</BaseButton>
</template>
```
  

> [eslint-plugin-vue: component rules](https://eslint.vuejs.org/rules/)

---

### Dead Code Detection in Vue

Find unused props, refs, and emits before they become tech debt.

```typescript
// eslint.config.ts
{
  files: ['src/**/*.vue'],
  rules: {
    'vue/no-unused-properties': ['error', {
      groups: ['props', 'data', 'computed', 'methods']
    }],
    'vue/no-unused-refs': 'error',
    'vue/no-unused-emit-declarations': 'error'
  }
}
```

  
```vue
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
  subtitle: string  // Never used!
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'hover'): void  // Never emitted!
}>()

const buttonRef = ref<HTMLButtonElement>()  // Never used!
</script>

<template>
  <h1>{{ title }}</h1>
  <button @click="emit('click')">Click</button>
</template>
```
  
  
```vue
<script setup lang="ts">
const props = defineProps<{
  title: string
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <h1>{{ title }}</h1>
  <button @click="emit('click')">Click</button>
</template>
```
  

> [eslint-plugin-vue: no-unused-properties](https://eslint.vuejs.org/rules/no-unused-properties.html)

---

### No Hardcoded i18n Strings

Hardcoded strings break internationalization. The `@intlify/vue-i18n` plugin catches them.

```typescript
// eslint.config.ts
{
  files: ['src/**/*.vue'],
  plugins: { '@intlify/vue-i18n': pluginVueI18n },
  rules: {
    '@intlify/vue-i18n/no-raw-text': ['error', {
      ignorePattern: '^[-#:()&+×/°′″%]+',
      ignoreText: ['kg', 'lbs', 'cm', 'ft/in', '—', '•', '✓', '›', '→', '·', '.', 'Close'],
      attributes: {
        '/.+/': ['title', 'aria-label', 'aria-placeholder', 'placeholder', 'alt']
      }
    }]
  }
}
```

The `attributes` option catches hardcoded strings in accessibility attributes too.

  
```vue
<template>
  <button>Save Changes</button>
  <p>No items found</p>
</template>
```
  
  
```vue
<template>
  <button>{{ t('common.save') }}</button>
  <p>{{ t('items.empty') }}</p>
</template>
```
  

> [eslint-plugin-vue-i18n](https://eslint-plugin-vue-i18n.intlify.dev/)

---

### No Disabling i18n Rules

Prevent developers from bypassing i18n checks with `eslint-disable` comments.

```typescript
// eslint.config.ts
{
  files: ['src/**/*.vue'],
  plugins: {
    '@eslint-community/eslint-comments': pluginEslintComments
  },
  rules: {
    '@eslint-community/eslint-comments/no-restricted-disable': [
      'error',
      '@intlify/vue-i18n/*'
    ]
  }
}
```

  
```vue
<!-- eslint-disable-next-line @intlify/vue-i18n/no-raw-text -->
<button>Save Changes</button>
```
  
  
```vue
<button>{{ t('common.save') }}</button>
```
  

> [@eslint-community/eslint-plugin-eslint-comments](https://github.com/eslint-community/eslint-plugin-eslint-comments)

---

### No Hardcoded Route Strings

Use named routes instead of hardcoded path strings for maintainability.

```typescript
// eslint.config.ts
{
  rules: {
    'no-restricted-syntax': ['error',
      {
        selector: 'CallExpression[callee.property.name="push"][callee.object.name="router"] > Literal:first-child',
        message: 'Use named routes with RouteNames instead of hardcoded path strings.'
      },
      {
        selector: 'CallExpression[callee.property.name="push"][callee.object.name="router"] > TemplateLiteral:first-child',
        message: 'Use named routes with RouteNames instead of template literals.'
      }
    ]
  }
}
```

  
```typescript
router.push('/workout/123')
router.push(`/workout/${id}`)
```
  
  
```typescript
router.push({ name: RouteNames.WorkoutDetail, params: { id } })
```
  

> [ESLint: no-restricted-syntax](https://eslint.org/docs/latest/rules/no-restricted-syntax)

---

### Enforce Integration Test Helpers

Ban direct `render()` or `mount()` calls in tests. Use a centralized test helper instead. For more on testing strategies in Vue, see [Vue 3 Testing Pyramid: A Practical Guide with Vitest Browser Mode](/blog/vue3_testing_pyramid_vitest_browser_mode).

```typescript
// eslint.config.ts
{
  files: ['src/**/__tests__/**/*.{ts,spec.ts}'],
  ignores: ['src/__tests__/helpers/**'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        {
          name: 'vitest-browser-vue',
          importNames: ['render'],
          message: 'Use createTestApp() from @/__tests__/helpers/createTestApp instead.'
        },
        {
          name: '@vue/test-utils',
          importNames: ['mount', 'shallowMount'],
          message: 'Use createTestApp() instead of mounting components directly.'
        }
      ]
    }]
  }
}
```

  
```typescript
import { render } from 'vitest-browser-vue'
import { mount } from '@vue/test-utils'

const { getByText } = render(MyComponent)
const wrapper = mount(MyComponent)
```
  
  
```typescript
import { createTestApp } from '@/__tests__/helpers/createTestApp'

const { page } = await createTestApp({ route: '/workout' })
```
  

This ensures all tests use consistent setup with routing, i18n, and database.

> [ESLint: no-restricted-imports](https://eslint.org/docs/latest/rules/no-restricted-imports)

---

### Enforce pnpm Catalogs

When using pnpm workspaces, enforce that dependencies use catalog references.

```typescript
// eslint.config.ts
import { configs as pnpmConfigs } from 'eslint-plugin-pnpm'

export default defineConfigWithVueTs(
  // ... other configs
  ...pnpmConfigs.recommended,
)
```

This ensures dependencies are managed centrally in `pnpm-workspace.yaml`.

> [eslint-plugin-pnpm](https://github.com/nickmccurdy/eslint-plugin-pnpm)

---

## Nice-to-Have Rules

These rules improve code quality but are less critical. Enable them after the must-haves are in place.

---

### Vue 3.5+ API Enforcement

Use the latest Vue 3.5 APIs for cleaner code.

```typescript
// eslint.config.ts
{
  files: ['src/**/*.vue'],
  rules: {
    'vue/define-props-destructuring': 'error',
    'vue/prefer-use-template-ref': 'error'
  }
}
```

  
```vue
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ count: number }>()
const buttonRef = ref<HTMLButtonElement>()

console.log(props.count)  // Using props. prefix
</script>

<template>
  <button ref="buttonRef">Click</button>
</template>
```
  
  
```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'

const { count } = defineProps<{ count: number }>()
const buttonRef = useTemplateRef<HTMLButtonElement>('button')

console.log(count)  // Direct destructured access
</script>

<template>
  <button ref="button">Click</button>
</template>
```
  

> [eslint-plugin-vue: define-props-destructuring](https://eslint.vuejs.org/rules/define-props-destructuring.html)

---

### Explicit Component APIs

Require `defineExpose` and `defineSlots` to make component interfaces explicit.

```typescript
// eslint.config.ts
{
  files: ['src/**/*.vue'],
  rules: {
    'vue/require-expose': 'warn',
    'vue/require-explicit-slots': 'warn'
  }
}
```

  
```vue
<script setup lang="ts">
function focus() { /* ... */ }
</script>

<template>
  <slot />
</template>
```
  
  
```vue
<script setup lang="ts">
defineSlots<{
  default(): unknown
}>()

function focus() { /* ... */ }

defineExpose({ focus })
</script>

<template>
  <slot />
</template>
```
  

> [eslint-plugin-vue: require-expose](https://eslint.vuejs.org/rules/require-expose.html)

---

### Template Depth Limit

Deep template nesting is hard to read. Extract nested sections into components. This one matters a lot—it helps you avoid ending up with components that are 2000 lines long.

```typescript
// eslint.config.ts
{
  files: ['src/**/*.vue'],
  rules: {
    'vue/max-template-depth': ['error', { maxDepth: 8 }],
    'vue/max-props': ['error', { maxProps: 6 }]
  }
}
```

  
```vue
<template>
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <span>Too deep!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```
  
  
```vue
<template>
  <Card>
    <CardHeader>
      <CardTitle>Title</CardTitle>
    </CardHeader>
    <CardContent>
      <span>Content</span>
    </CardContent>
  </Card>
</template>
```
  

> [eslint-plugin-vue: max-template-depth](https://eslint.vuejs.org/rules/max-template-depth.html)

---

### Better Assertions in Tests

Use specific matchers for clearer test failures.

```typescript
// eslint.config.ts
{
  files: ['src/**/__tests__/*'],
  rules: {
    'vitest/prefer-to-be': 'error',
    'vitest/prefer-to-have-length': 'error',
    'vitest/prefer-to-contain': 'error',
    'vitest/prefer-mock-promise-shorthand': 'error'
  }
}
```

  
```typescript
expect(value === null).toBe(true)
expect(arr.length).toBe(3)
expect(arr.includes('foo')).toBe(true)
```
  
  
```typescript
expect(value).toBeNull()
expect(arr).toHaveLength(3)
expect(arr).toContain('foo')

// Also prefer mock shorthands
vi.fn().mockResolvedValue('data')  // Instead of mockReturnValue(Promise.resolve('data'))
```
  

> [eslint-plugin-vitest](https://github.com/veritem/eslint-plugin-vitest)

---

### Test Structure Rules

Keep tests organized and readable.

```typescript
// eslint.config.ts
{
  files: ['src/**/__tests__/*'],
  rules: {
    'vitest/consistent-test-it': ['error', { fn: 'it' }],
    'vitest/prefer-hooks-on-top': 'error',
    'vitest/prefer-hooks-in-order': 'error',
    'vitest/no-duplicate-hooks': 'error',
    'vitest/require-top-level-describe': 'error',
    'vitest/max-nested-describe': ['error', { max: 2 }],
    'vitest/no-conditional-in-test': 'warn'
  }
}
```

  
```typescript
test('works', () => {})  // Inconsistent: test vs it
it('also works', () => {})

describe('feature', () => {
  it('test 1', () => {})

  beforeEach(() => {})  // Hook after test!

  describe('nested', () => {
    describe('too deep', () => {
      describe('way too deep', () => {})  // 3 levels!
    })
  })
})
```
  
  
```typescript
describe('feature', () => {
  beforeEach(() => {})  // Hooks first, in order

  it('does something', () => {})
  it('does another thing', () => {})

  describe('edge cases', () => {
    it('handles null', () => {})
  })
})

// no-conditional-in-test prevents flaky tests
// Bad: if (data.length > 0) { expect(data[0]).toBeDefined() }
// Good: expect(data).toHaveLength(3); expect(data[0]).toBeDefined()
```
  

> [eslint-plugin-vitest](https://github.com/veritem/eslint-plugin-vitest)

---

### Prefer Vitest Locators in Tests

Use Vitest Browser locators instead of raw DOM queries.

```typescript
// eslint.config.ts
{
  files: ['src/**/__tests__/**/*.{ts,spec.ts}'],
  rules: {
    'no-restricted-syntax': ['warn', {
      selector: 'CallExpression[callee.property.name=/^querySelector(All)?$/]',
      message: 'Prefer page.getByRole(), page.getByText(), or page.getByTestId() over querySelector. Vitest locators are more resilient to DOM changes.'
    }]
  }
}
```

  
```typescript
const button = container.querySelector('.submit-btn')
await button?.click()
```
  
  
```typescript
const button = page.getByRole('button', { name: 'Submit' })
await button.click()
```
  

> [Vitest Browser Mode](https://vitest.dev/guide/browser/)

---

### Unicorn Rules

The `eslint-plugin-unicorn` package catches common mistakes and enforces modern JavaScript patterns.

```typescript
// eslint.config.ts
pluginUnicorn.configs.recommended,

{
  name: 'app/unicorn-overrides',
  rules: {
    // === Enable non-recommended rules that add value ===
    'unicorn/better-regex': 'warn',              // Simplify regexes: /[0-9]/ → /\d/
    'unicorn/custom-error-definition': 'error',  // Correct Error subclassing
    'unicorn/no-unused-properties': 'warn',      // Dead code detection
    'unicorn/consistent-destructuring': 'warn',  // Use destructured vars consistently

    // === Disable rules that conflict with project conventions ===
    'unicorn/no-null': 'off',                    // We use null for database values
    'unicorn/filename-case': 'off',              // Vue uses PascalCase, tests use camelCase
    'unicorn/prevent-abbreviations': 'off',      // props, e, Db are fine
    'unicorn/no-array-callback-reference': 'off', // arr.filter(isValid) is fine
    'unicorn/no-await-expression-member': 'off', // (await fetch()).json() is fine
    'unicorn/no-array-reduce': 'off',            // reduce is useful for aggregations
    'unicorn/no-useless-undefined': 'off'        // mockResolvedValue(undefined) for TS
  }
}
```

**Examples:**

```typescript
// unicorn/better-regex
// Bad:  /[0-9]/
// Good: /\d/

// unicorn/consistent-destructuring
// Bad:
const { foo } = object
console.log(object.bar)  // Uses object.bar instead of destructuring

// Good:
const { foo, bar } = object
console.log(bar)
```

> [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn)

---

## Custom Local Rules

Sometimes you need rules that don't exist. Write them yourself.

### Composable Must Use Vue

A file named `use*.ts` should import from Vue. If it doesn't, it's a utility, not a composable. For more on writing proper composables, see [Vue Composables Style Guide: Lessons from VueUse's Codebase](/blog/vueuse_composables_style_guide).

```typescript
// eslint-local-rules/composable-must-use-vue.ts
const VALID_VUE_SOURCES = new Set(['vue', '@vueuse/core', 'vue-router', 'vue-i18n'])
const VALID_PATH_PATTERNS = [/^@\/stores\//]  // Global state composables count too

function isComposableFilename(filename: string): boolean {
  return /^use[A-Z]/.test(path.basename(filename, '.ts'))
}

const rule: Rule.RuleModule = {
  meta: {
    messages: {
      notAComposable: 'File "{{filename}}" does not import from Vue. Rename it or add Vue imports.'
    }
  },
  create(context) {
    if (!isComposableFilename(context.filename)) return {}

    let hasVueImport = false

    return {
      ImportDeclaration(node) {
        if (VALID_VUE_SOURCES.has(node.source.value)) {
          hasVueImport = true
        }
      },
      'Program:exit'(node) {
        if (!hasVueImport) {
          context.report({ node, messageId: 'notAComposable' })
        }
      }
    }
  }
}
```

  
```typescript
// src/composables/useFormatter.ts
export function useFormatter() {
  return {
    formatDate: (d: Date) => d.toISOString()  // No Vue imports!
  }
}
```
  
  
```typescript
// src/lib/formatter.ts (renamed)
export function formatDate(d: Date) {
  return d.toISOString()
}

// OR add Vue reactivity:
// src/composables/useFormatter.ts
import { computed, ref } from 'vue'

export function useFormatter() {
  const locale = ref('en-US')
  const formatter = computed(() => new Intl.DateTimeFormat(locale.value))
  return { formatter, locale }
}
```
  

---

### No Hardcoded Tailwind Colors

Hardcoded Tailwind colors (`bg-blue-500`) make theming impossible. Use semantic colors (`bg-primary`).

```typescript
// eslint-local-rules/no-hardcoded-colors.ts
// Status colors (red, amber, yellow, green, emerald) are ALLOWED for semantic states
const HARDCODED_COLORS = ['slate', 'gray', 'zinc', 'blue', 'purple', 'pink', 'orange', 'indigo', 'violet']
const COLOR_UTILITIES = ['bg', 'text', 'border', 'ring', 'fill', 'stroke']

const rule: Rule.RuleModule = {
  meta: {
    messages: {
      noHardcodedColor: 'Avoid "{{color}}". Use semantic classes like bg-primary, text-foreground.'
    }
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== 'string') return

        const matches = findHardcodedColors(node.value)
        for (const color of matches) {
          context.report({ node, messageId: 'noHardcodedColor', data: { color } })
        }
      }
    }
  }
}
```

  
```vue
<template>
  <button class="bg-blue-500 text-white">Click</button>
</template>
```
  
  
```vue
<template>
  <button class="bg-primary text-primary-foreground">Click</button>
</template>
```
  

> 
Status colors (`red`, `amber`, `yellow`, `green`, `emerald`) are intentionally allowed for error/warning/success states. Only use these for semantic status indication, not general styling.

---

### No let in describe Blocks

Mutable variables in test describe blocks create hidden state. Use setup functions instead.

```typescript
// eslint-local-rules/no-let-in-describe.ts
const rule: Rule.RuleModule = {
  meta: {
    messages: {
      noLetInDescribe: 'Avoid `let` in describe blocks. Use setup functions instead.'
    }
  },
  create(context) {
    let describeDepth = 0

    return {
      CallExpression(node) {
        if (isDescribeCall(node)) describeDepth++
      },
      'CallExpression:exit'(node) {
        if (isDescribeCall(node)) describeDepth--
      },
      VariableDeclaration(node) {
        if (describeDepth > 0 && node.kind === 'let') {
          context.report({ node, messageId: 'noLetInDescribe' })
        }
      }
    }
  }
}
```

  
```typescript
describe('Login', () => {
  let user: User

  beforeEach(() => {
    user = createUser()  // Hidden mutation!
  })

  it('works', () => {
    expect(user.name).toBe('test')
  })
})
```
  
  
```typescript
describe('Login', () => {
  function setup() {
    return { user: createUser() }
  }

  it('works', () => {
    const { user } = setup()
    expect(user.name).toBe('test')
  })
})
```
  

---

### Extract Complex Conditions

Complex boolean expressions should have names. Extract them into variables.

```typescript
// eslint-local-rules/extract-condition-variable.ts
const OPERATOR_THRESHOLD = 2  // Conditions with 2+ logical operators need extraction

const rule: Rule.RuleModule = {
  meta: {
    messages: {
      extractCondition: 'Complex condition should be extracted into a named const.'
    }
  },
  create(context) {
    return {
      IfStatement(node) {
        // Skip patterns that TypeScript needs inline for narrowing
        if (isEarlyExitGuard(node.consequent)) return  // if (!x) return
        if (hasOptionalChaining(node.test)) return      // if (user?.name)
        if (hasTruthyNarrowingPattern(node.test)) return // if (arr && arr[0])

        if (countOperators(node.test) >= OPERATOR_THRESHOLD) {
          context.report({ node: node.test, messageId: 'extractCondition' })
        }
      }
    }
  }
}
```

**Smart Exceptions:** The rule skips several patterns that TypeScript needs inline for type narrowing:
- Early exit guards: `if (!user) return`
- Optional chaining: `if (user?.name)`
- Truthy narrowing: `if (arr && arr[0])`

  
```typescript
if (user.isActive && user.role === 'admin' && !user.isBanned) {
  showAdminPanel()
}
```
  
  
```typescript
const canAccessAdminPanel = user.isActive && user.role === 'admin' && !user.isBanned

if (canAccessAdminPanel) {
  showAdminPanel()
}
```
  

---

### Repository tryCatch Wrapper

Database calls can fail. Enforce wrapping them in `tryCatch()`.

```typescript
// eslint-local-rules/repository-trycatch.ts
// Matches pattern: get*Repository().method()
const REPO_PATTERN = /^get\w+Repository$/

const rule: Rule.RuleModule = {
  meta: {
    messages: {
      missingTryCatch: 'Repository calls must be wrapped with tryCatch().'
    }
  },
  create(context) {
    return {
      AwaitExpression(node) {
        if (!isRepositoryMethodCall(node.argument)) return
        if (isWrappedInTryCatch(context, node)) return

        context.report({ node, messageId: 'missingTryCatch' })
      }
    }
  }
}
```

  
```typescript
const workouts = await getWorkoutRepository().findAll()  // Might throw!
```
  
  
```typescript
const [error, workouts] = await tryCatch(getWorkoutRepository().findAll())

if (error) {
  showError('Failed to load workouts')
  return
}
```
  

> 
This rule matches the `get*Repository()` pattern. Ensure your repository factory functions follow this naming convention.

---

## The Full Config

```typescript
import pluginEslintComments from '@eslint-community/eslint-plugin-eslint-comments'
import pluginVueI18n from '@intlify/eslint-plugin-vue-i18n'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginImportX from 'eslint-plugin-import-x'
import pluginOxlint from 'eslint-plugin-oxlint'
import { configs as pnpmConfigs } from 'eslint-plugin-pnpm'
import pluginUnicorn from 'eslint-plugin-unicorn'
import pluginVue from 'eslint-plugin-vue'
import localRules from './eslint-local-rules'

export default defineConfigWithVueTs(
  { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'] },

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  pluginUnicorn.configs.recommended,

  // Vue component rules
  {
    files: ['src/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': ['error', { ignores: ['App', 'Layout'] }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/prop-name-casing': ['error', 'camelCase'],
      'vue/custom-event-name-casing': ['error', 'kebab-case'],
      'vue/no-unused-properties': ['error', { groups: ['props', 'data', 'computed', 'methods'] }],
      'vue/no-unused-refs': 'error',
      'vue/define-props-destructuring': 'error',
      'vue/prefer-use-template-ref': 'error',
      'vue/max-template-depth': ['error', { maxDepth: 8 }],
    },
  },

  // TypeScript style guide
  {
    files: ['src/**/*.{ts,vue}'],
    rules: {
      'complexity': ['warn', { max: 10 }],
      'no-nested-ternary': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      'no-restricted-syntax': ['error',
        { selector: 'TSEnumDeclaration', message: 'Use literal unions instead of enums.' },
        { selector: 'IfStatement > :not(IfStatement).alternate', message: 'Avoid else. Use early returns.' },
        { selector: 'TryStatement', message: 'Use tryCatch() instead of try/catch.' },
      ],
    },
  },

  // Feature boundaries
  {
    files: ['src/**/*.{ts,vue}'],
    plugins: { 'import-x': pluginImportX },
    rules: {
      'import-x/no-restricted-paths': ['error', {
        zones: [
          { target: './src/features/workout', from: './src/features', except: ['./workout'] },
          // ... other features
          { target: './src/features', from: './src/views' },  // Unidirectional flow
        ]
      }],
    },
  },

  // i18n rules
  {
    files: ['src/**/*.vue'],
    plugins: { '@intlify/vue-i18n': pluginVueI18n },
    rules: {
      '@intlify/vue-i18n/no-raw-text': ['error', { /* config */ }],
    },
  },

  // Prevent disabling i18n rules
  {
    files: ['src/**/*.vue'],
    plugins: { '@eslint-community/eslint-comments': pluginEslintComments },
    rules: {
      '@eslint-community/eslint-comments/no-restricted-disable': ['error', '@intlify/vue-i18n/*'],
    },
  },

  // Vitest rules
  {
    files: ['src/**/__tests__/*'],
    ...pluginVitest.configs.recommended,
    rules: {
      'vitest/consistent-test-it': ['error', { fn: 'it' }],
      'vitest/prefer-hooks-on-top': 'error',
      'vitest/prefer-hooks-in-order': 'error',
      'vitest/no-duplicate-hooks': 'error',
      'vitest/max-nested-describe': ['error', { max: 2 }],
      'vitest/no-conditional-in-test': 'warn',
    },
  },

  // Enforce test helpers
  {
    files: ['src/**/__tests__/**/*.{ts,spec.ts}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'vitest-browser-vue', importNames: ['render'], message: 'Use createTestApp()' },
          { name: '@vue/test-utils', importNames: ['mount'], message: 'Use createTestApp()' },
        ]
      }],
    },
  },

  // Local rules
  {
    files: ['src/**/*.{ts,vue}'],
    plugins: { local: localRules },
    rules: {
      'local/no-hardcoded-colors': 'error',
      'local/composable-must-use-vue': 'error',
      'local/repository-trycatch': 'error',
      'local/extract-condition-variable': 'error',
      'local/no-let-in-describe': 'error',
    },
  },

  // Disable rules handled by Oxlint
  ...pluginOxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),

  // pnpm catalog enforcement
  ...pnpmConfigs.recommended,

  skipFormatting,
)
```

---

## Summary

| Category | Rule | Purpose |
|----------|------|---------|
| **Must Have** | `complexity` | Limit function complexity |
| **Must Have** | `no-nested-ternary` | Readable conditionals |
| **Must Have** | `consistent-type-assertions` | No unsafe `as` casts |
| **Must Have** | `no-restricted-syntax` (enums) | Use unions over enums |
| **Must Have** | `no-restricted-syntax` (else) | Prefer early returns |
| **Must Have** | `no-restricted-syntax` (routes) | Use named routes |
| **Must Have** | `import-x/no-restricted-paths` | Feature isolation |
| **Must Have** | `vue/no-unused-*` | Dead code detection |
| **Must Have** | `@intlify/vue-i18n/no-raw-text` | i18n compliance |
| **Must Have** | `no-restricted-disable` | No bypassing i18n |
| **Must Have** | `no-restricted-imports` | Enforce test helpers |
| **Nice to Have** | `vue/define-props-destructuring` | Vue 3.5 patterns |
| **Nice to Have** | `vue/max-template-depth` | Template readability |
| **Nice to Have** | `vitest/*` | Test consistency |
| **Nice to Have** | `unicorn/*` | Modern JavaScript |
| **Nice to Have** | `pnpm/recommended` | Catalog enforcement |
| **Custom** | `composable-must-use-vue` | Composable validation |
| **Custom** | `no-hardcoded-colors` | Theming support |
| **Custom** | `no-let-in-describe` | Clean tests |
| **Custom** | `extract-condition-variable` | Readable conditions |
| **Custom** | `repository-trycatch` | Error handling |

Start with the must-haves. Add nice-to-haves when you're ready. Write custom rules when nothing else fits.

The combination of Oxlint for speed and ESLint for coverage gives you fast feedback during development and comprehensive checks in CI.
