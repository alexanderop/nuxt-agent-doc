---
author: Alexander Opalic
pubDatetime: 2024-11-30T00:00:00Z
title: "Deploy your Vue App to GitHub Pages with Caching"
slug: github-actions-vue-deployment-caching
description: "Learn how to speed up your GitHub Actions workflows by caching node_modules and properly deploy Vue apps to GitHub Pages"
tags:
  - github-actions
  - vue
  - deployment
  - performance
---

## Problem

Need a free and efficient way to deploy a Vue app? GitHub Pages is an excellent solution. Here's how to set it up with proper caching.

## Solution

### 1. Enable GitHub Pages

Go to repository Settings > Pages and enable GitHub Pages.

### 2. Create GitHub Action

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm

      - name: Cache node modules
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 3. Configure Vite

Update `vite.config.ts`:

```typescript
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [vue()],
  base: command === "build" ? "/your-repo-name/" : "/",
}));
```

## Key Features

- Implements dependency caching to speed up builds
- Uses proper concurrency control to prevent conflicting deployments
- Automatically configures correct base URL for GitHub Pages
- Utilizes latest GitHub Actions versions

#github-actions #vue #deployment #performance
