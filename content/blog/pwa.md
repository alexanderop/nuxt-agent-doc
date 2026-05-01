---
author: Alexander Opalic
pubDatetime: 2024-10-20T09:44:12.000+02:00
modDatetime: 2024-12-31T00:00:00.000+02:00
title: "Create a Native-Like App in 4 Steps: PWA Magic with Vue 3 and Vite"
slug: "create-pwa-vue3-vite-4-steps"
draft: false
seriesTag: "local-first-web-development"
seriesTitle: "Local-First Web Development Series"
tags:
  - vue
  - pwa
  - vite
description: Transform your Vue 3 project into a powerful Progressive Web App in just 4 steps. Learn how to create offline-capable, installable web apps using Vite and modern PWA techniques.
---

## Table of Contents

## Introduction

Progressive Web Apps (PWAs) have revolutionized our thoughts on web applications. PWAs offer a fast, reliable, and engaging user experience by combining the best web and mobile apps. They work offline, can be installed on devices, and provide a native app-like experience without app store distribution.

This guide will walk you through creating a Progressive Web App using Vue 3 and Vite. By the end of this tutorial, you’ll have a fully functional PWA that can work offline, be installed on users’ devices, and leverage modern web capabilities.

## Understanding the Basics of Progressive Web Apps (PWAs)

Before diving into the development process, it's crucial to grasp the fundamental concepts of PWAs:

- **Multi-platform Compatibility**: PWAs are designed for applications that can function across multiple platforms, not just the web.
- **Build Once, Deploy Everywhere**: With PWAs, you can develop an application once and deploy it on Android, iOS, Desktop, and Web platforms.
- **Enhanced User Experience**: PWAs offer features like offline functionality, push notifications, and home screen installation.

For a more in-depth understanding of PWAs, refer to the [MDN Web Docs on Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps).

## Prerequisites for Building a PWA with Vue 3 and Vite

Before you start, make sure you have the following tools installed:

1. Node.js installed on your system
2. Package manager: pnpm, npm, or yarn
3. Basic familiarity with Vue 3

## Step 1: Setting Up the Vue Project

First, we'll set up a new Vue project using the latest Vue CLI. This will give us a solid foundation to build our PWA upon.

1. Create a new Vue project by running the following command in your terminal:

   ```bash
   pnpm create vue@latest
   ```

2. Follow the prompts to configure your project. Here's an example configuration:

   ```shell
   ✔ Project name: … local-first-example
   ✔ Add TypeScript? … Yes
   ✔ Add JSX Support? … Yes
   ✔ Add Vue Router for Single Page Application development? … Yes
   ✔ Add Pinia for state management? … Yes
   ✔ Add Vitest for Unit Testing? … Yes
   ✔ Add an End-to-End Testing Solution? › No
   ✔ Add ESLint for code quality? … Yes
   ✔ Add Prettier for code formatting? … Yes
   ✔ Add Vue DevTools 7 extension for debugging? (experimental) … Yes
   ```

3. Once the project is created, navigate to your project directory and install dependencies:
   ```bash
   cd local-first-example
   pnpm install
   pnpm run dev
   ```

Great! You now have a basic Vue 3 project up and running. Let's move on to adding PWA functionality.

## Step 2: Create the needed assets for the PWA

We need to add specific assets and configurations to transform our Vue app into a PWA.
PWAs can be installed on various devices, so we must prepare icons and other assets for different platforms.

1. First, let's install the necessary packages:

   ```bash
   pnpm add -D vite-plugin-pwa @vite-pwa/assets-generator
   ```

2. Create a high-resolution icon (preferably an SVG or a PNG with at least 512x512 pixels) for your PWA and place it in your `public` directory. Name it something like `pwa-icon.svg` or `pwa-icon.png`.

3. Generate the PWA assets by running:
   ```bash
   npx pwa-asset-generator --preset minimal public/pwa-icon.svg
   ```

This command will automatically generate a set of icons and a web manifest file in your `public` directory. The `minimal` preset will create:

- favicon.ico (48x48 transparent icon for browser tabs)
- favicon.svg (SVG icon for modern browsers)
- apple-touch-icon-180x180.png (Icon for iOS devices when adding to home screen)
- maskable-icon-512x512.png (Adaptive icon that fills the entire shape on Android devices)
- pwa-64x64.png (Small icon for various UI elements)
- pwa-192x192.png (Medium-sized icon for app shortcuts and tiles)
- pwa-512x512.png (Large icon for high-resolution displays and splash screens)

Output will look like this:

```shell
> vue3-pwa-timer@0.0.0 generate-pwa-assets /Users/your user/git2/vue3-pwa-example
> pwa-assets-generator "--preset" "minimal-2023" "public/pwa-icon.svg"

Zero Config PWA Assets Generator v0.2.6
◐ Preparing to generate PWA assets...
◐ Resolving instructions...
✔ PWA assets ready to be generated, instructions resolved
◐ Generating PWA assets from public/pwa-icon.svg image
◐ Generating assets for public/pwa-icon.svg...
✔ Generated PNG file: /Users/your user/git2/vue3-pwa-example/public/pwa-64x64.png
✔ Generated PNG file: /Users/your user/git2/vue3-pwa-example/public/pwa-192x192.png
✔ Generated PNG file: /Users/your user/git2/vue3-pwa-example/public/pwa-512x512.png
✔ Generated PNG file: /Users/your user/git2/vue3-pwa-example/public/maskable-icon-512x512.png
✔ Generated PNG file: /Users/your user/git2/vue3-pwa-example/public/apple-touch-icon-180x180.png
✔ Generated ICO file: /Users/your user/git2/vue3-pwa-example/public/favicon.ico
✔ Assets generated for public/pwa-icon.svg
◐ Generating Html Head Links...
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/pwa-icon.svg" sizes="any" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">
✔ Html Head Links generated
◐ Generating PWA web manifest icons entry...
{
  "icons": [
    {
      "src": "pwa-64x64.png",
      "sizes": "64x64",
      "type": "image/png"
    },
    {
      "src": "pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "maskable-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
✔ PWA web manifest icons entry generated
✔ PWA assets generated
```

These steps will ensure your PWA has all the necessary icons and assets to function correctly across different devices and platforms.
The minimal-2023 preset provides a modern, optimized set of icons that meet the latest PWA requirements.

## Step 3: Configuring Vite for PWA Support

With our assets ready, we must configure Vite to enable PWA functionality. This involves setting up the manifest and other PWA-specific options.

First, update your main HTML file (usually `index.html`) to include important meta tags in the `<head>` section:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#ffffff" />
  <link rel="icon" href="/favicon.ico" sizes="48x48" />
  <link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
</head>
```

Now, update your `vite.config.ts` file with the following configuration:

```typescript
import { fileURLToPath, URL } from "node:url";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon-180x180.png",
        "maskable-icon-512x512.png",
      ],
      manifest: {
        name: "My Awesome PWA",
        short_name: "MyPWA",
        description: "A PWA built with Vue 3",
        theme_color: "#ffffff",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
```

> 
  The `devOptions: { enabled: true }` setting is crucial for testing your PWA on localhost. Normally, PWAs require HTTPS, but this setting allows the PWA features to work on `http://localhost` during development. Remember to remove or set this to `false` for production builds.

This configuration generates a Web App Manifest, a JSON file that tells the browser about your Progressive Web App and how it should behave when installed on the user’s desktop or mobile device. The manifest includes the app’s name, icons, and theme colors.

## PWA Lifecycle and Updates

The `registerType: 'autoUpdate'` option in our configuration sets up automatic updates for our PWA. Here's how it works:

1. When a user visits your PWA, the browser downloads and caches the latest version of your app.
2. On subsequent visits, the service worker checks for updates in the background.
3. If an update is available, it's downloaded and prepared for the next launch.
4. The next time the user opens or refreshes the app, they'll get the latest version.

This ensures that users always have the most up-to-date version of your app without manual intervention.

## Step 4: Implementing Offline Functionality with Service Workers

The real power of PWAs comes from their ability to work offline. We'll use the `vite-plugin-pwa` to integrate Workbox, which will handle our service worker and caching strategies.

Before we dive into the configuration, let's understand the runtime caching strategies we'll be using:

1. **StaleWhileRevalidate** for static resources (styles, scripts, and workers):
   - This strategy serves cached content immediately while fetching an update in the background.
   - It's ideal for frequently updated resources that aren't 100% up-to-date.
   - We'll limit the cache to 50 entries and set an expiration of 30 days.

2. **CacheFirst** for images:
   - This strategy serves cached images immediately without network requests if they're available.
   - It's perfect for static assets that don't change often.
   - We'll limit the image cache to 100 entries and set an expiration of 60 days.

These strategies ensure that your PWA remains functional offline while efficiently managing cache storage.

Now, let's update your `vite.config.ts` file to include service worker configuration with these advanced caching strategies:

```typescript
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      devOptions: {
        enabled: true,
      },
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Vue 3 PWA Timer",
        short_name: "PWA Timer",
        description: "A customizable timer for Tabata and EMOM workouts",
        theme_color: "#ffffff",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === "style" ||
              request.destination === "script" ||
              request.destination === "worker",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
              },
            },
          },
        ],
      },
    }),
  ],
});
```

## Testing Your PWA

Now that we've set up our PWA, it's time to test its capabilities:

1. Test your PWA locally:

   ```bash
   pnpm run dev
   ```

2. Open Chrome DevTools and navigate to the Application tab.
   - Check the "Manifest" section to ensure your Web App Manifest is loaded correctly.
   - In the "Service Workers" section, verify that your service worker is registered and active.
     [![PWA Service Worker](../../assets/images/pwa/serviceWorker.png)

3. Test offline functionality:
   - Go to the Network tab in DevTools and check the "Offline" box to simulate offline conditions.
   - Refresh the page and verify that your app still works without an internet connection.
   - Uncheck the “Offline” box and refresh to ensure the app works online.

4. Test caching:
   - In the Application tab, go to "Cache Storage" to see the caches created by your service worker.
   - Verify that assets are being cached according to your caching strategies.

5. Test installation:
   - On desktop: Look for the install icon in the address bar or the three-dot menu.
     [![PWA Install Icon](../../assets/images/pwa/desktopInstall.png)](../../assets/images/pwa/desktopInstall.png)
     [![PWA Install Icon](../../assets/images/pwa/installApp.png)](../../assets/images/pwa/installApp.png)

   - On mobile: You should see a prompt to "Add to Home Screen".

6. Test updates:
   - Make a small change to your app and redeploy.
   - Revisit the app and check if the service worker updates (you can monitor this in the Application tab).

By thoroughly testing these aspects, you can ensure that your PWA functions correctly across various scenarios and platforms.

> 
  If you want to see a full-fledged PWA in action, check out
  [Elk](https://elk.zone/), a nimble Mastodon web client. It's built with Nuxt
  and is anexcellent example of a production-ready PWA. You can also explore its
  open-source code on [GitHub](https://github.com/elk-zone/elk) to see how
  they've implemented various PWA features.

## Conclusion

Congratulations! You've successfully created a Progressive Web App using Vue 3 and Vite.
Your app can now work offline, be installed on users' devices, and provide a native-like experience.

Refer to the [Vite PWA Workbox documentation](https://vite-pwa-org.netlify.app/workbox/) for more advanced Workbox configurations and features.

The more challenging part is building suitable components with a native-like feel on all the devices you want to support.
PWAs are also a main ingredient in building local-first applications.
If you are curious about what I mean by that, check out the following: [What is Local First Web Development](../what-is-local-first-web-development).

For a complete working example of this Vue 3 PWA, you can check out the complete source code at [full example](https://github.com/alexanderop/vue3-pwa-example).
This repository contains the finished project, allowing you to see how all the pieces come together in a real-world application.
