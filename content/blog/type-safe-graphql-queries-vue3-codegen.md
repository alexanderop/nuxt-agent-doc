---
author: Alexander Opalic
pubDatetime: 2025-05-04T00:00:00Z
title: "Type-Safe GraphQL Queries in Vue 3 with GraphQL Code Generator"
slug: type-safe-graphql-queries-vue3-codegen
draft: false
seriesTag: "vue-graphql-guide"
seriesTitle: "Vue 3 + GraphQL Series"
tags:
  - graphql
  - vue
description: "Part 2 of the Vue 3 + GraphQL series: generate fully-typed `useQuery` composables in Vue 3 with GraphQL Code Generator"
---

## Why plain TypeScript isn't enough

If you hover over the `result` from `useQuery` in last week's code, you'll still see `Ref<any>`. That means:

```vue
<li v-for="c in result?.countries2" :key="c.code"></li>
```

…slips right past TypeScript.

It's time to bring in **GraphQL Code Generator** which gives us:

- 100% typed operations, variables, and results
- Build-time schema validation (_fail fast, ship safe_)

## Step 1: Install the right packages

Let's start by installing the necessary dependencies:

```bash
npm i graphql
npm i -D typescript @graphql-codegen/cli
npm i -D @parcel/watcher
```

> 🚨 `@parcel/watcher` is a dev dependency.

## Step 2: Create a clean `codegen.ts`

Next, use the CLI to generate your config file:

```bash
npx graphql-code-generator init
```

When prompted, answer as follows:

```bash
? What type of application are you building? Application built with Vue
? Where is your schema?: (path or url) https://countries.trevorblades.com/graphql
? Where are your operations and fragments?: src/**/*.vue
? Where to write the output: src/gql/
? Do you want to generate an introspection file? No
? How to name the config file? codegen.ts
? What script in package.json should run the codegen? codegen
Fetching latest versions of selected plugins...
```

Your generated `codegen.ts` should look like this:

```ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "https://countries.trevorblades.com/graphql",
  documents: "src/**/*.vue",
  generates: {
    "src/gql/": {
      preset: "client",
      plugins: [],
    },
  },
};

export default config;
```

## Step 3: Add dev scripts and watch mode

Update your `package.json` scripts to streamline development:

```json
{
  "scripts": {
    "codegen": "graphql-codegen --config codegen.ts",
    "codegen:watch": "graphql-codegen --watch --config codegen.ts"
  }
}
```

## Step 4: Write your first typed query

Create a new file at `src/queries/countries.graphql`:

```graphql
query AllCountries {
  countries {
    code
    name
    emoji
  }
}
```

Then, generate your types:

```bash
npm run codegen
```

The command writes all generated types to `src/gql/`.

### Update your `CountryList.vue` component to use the generated types

```vue
<script setup lang="ts">
import { useQuery } from "@vue/apollo-composable";
import { AllCountriesDocument } from "../gql/graphql";
import { computed } from "vue";

const { result, loading, error } = useQuery(AllCountriesDocument);
const countries = computed(() => result.value?.countries);
</script>
```

### Inline queries with the generated `graphql` tag

Alternatively, define the query directly in your component using the generated `graphql` tag:

```vue
<script setup lang="ts">
import { useQuery } from "@vue/apollo-composable";
import { graphql } from "../gql";
import { computed } from "vue";

const COUNTRIES_QUERY = graphql(`
  query AllCountries {
    countries {
      code
      name
      emoji
    }
  }
`);

const { result, loading, error } = useQuery(COUNTRIES_QUERY);
const countries = computed(() => result.value?.countries);
</script>
```

## Watch mode

With `@parcel/watcher` installed, you can enable watch mode for a smoother development experience. If you frequently change your GraphQL schema while developing, simply run:

```bash
npm run codegen:watch
```

GraphQL Code Generator immediately throws an error when your local operations drift from the live schema.
Remember, your GraphQL server needs to be running for this to work.

## Bonus: Proper validation out of the box

A powerful benefit of this setup is **automatic validation**. If the Countries GraphQL API ever changes—say, it renames `code` to `code2`—you'll get an error when generating types.

For example, if you query for `code2`, you'll see:

```bash
⚠ Generate outputs
  ❯ Generate to src/gql/
    ✔ Load GraphQL schemas
    ✔ Load GraphQL documents
    ✖ GraphQL Document Validation failed with 1 errors;
      Error 0: Cannot query field "code2" on type "Country". Did you mean "code"?
```

## Should you commit generated files?

A common question: should you commit the generated types to your repository?

| Strategy        | Pros                              | Cons                                 |
| --------------- | --------------------------------- | ------------------------------------ |
| **Commit them** | Fast onboarding · Diff visibility | Noisy PRs · Merge conflicts          |
| **Ignore them** | Clean history · Zero conflicts    | Extra `npm run generate` in CI/local |

Many teams choose to commit generated files, **but** enforce `npm run generate -- --check` in CI to guard against stale artifacts.

## Up next (Part 3)

- **Fragments without repetition**

## Summary & Key Takeaways

In this part of the Vue 3 + GraphQL series, we:

- Set up GraphQL Code Generator v5 to create fully-typed queries and composables for Vue 3
- Learned how to configure `codegen.ts` for a remote schema and local `.vue` operations
- Automated type generation with dev scripts and watch mode for a smooth DX
- Used generated types and the `graphql` tag to eliminate `any` and catch schema errors at build time
- Discussed whether to commit generated files and best practices for CI

### What you learned

- How to make your GraphQL queries type-safe and schema-validated in Vue 3
- How to avoid runtime errors and catch breaking API changes early
- How to streamline your workflow with codegen scripts and watch mode
- The tradeoffs of committing vs. ignoring generated files in your repo

### Actionable reminders

- Always run `npm run generate` after changing queries or schema
- Use the generated types in your components for full type safety
- Consider enforcing type checks in CI to prevent stale artifacts

Stay tuned for Part 3, where we'll cover fragments and avoid repetition in your queries!

## Source Code

Find the full demo for this series here: [example](https://github.com/alexanderop/vue-graphql-simple-example)

> **Note:**  
> The code for this tutorial is on the `part-two` branch.  
> After cloning the repository, make sure to check out the correct branch:
>
> ```bash
> git clone https://github.com/alexanderop/vue-graphql-simple-example.git
> cd vue-graphql-simple-example
> git checkout part-two
> ```
>
> [View the branch directly on GitHub](https://github.com/alexanderop/vue-graphql-simple-example/tree/part-two)
