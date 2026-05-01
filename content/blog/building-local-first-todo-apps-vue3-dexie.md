---
author: Alexander Opalic
pubDatetime: 2025-01-11T00:00:00Z
title: "Building Local-First Todo Apps with Vue 3 and Dexie.js: A Complete Guide"
slug: building-local-first-todo-apps-vue3-dexie
draft: true
seriesTag: "local-first-web-development"
seriesTitle: "Local-First Web Development Series"
description: "Learn how to build a robust, offline-capable Todo application using Vue 3's Composition API and Dexie.js for IndexedDB storage. This guide covers core concepts and architecture."
tags: ["vue", "dexie", "indexeddb", "typescript", "local-first"]
---

In today's web development landscape, users expect applications to work reliably regardless of their network connection. This guide will walk you through building a local-first Todo application using Vue 3 and Dexie.js that delivers on this expectation. You can find the complete code in my [GitHub repository](https://github.com/alexanderop/vue-dexie/tree/main).

Note: This is not intended to be a detailed blog post but rather a helpful guide. After reading, I recommend checking out the Dexie.js documentation and the GitHub repository.

## What is Local-First?

Local-first software puts your data first - right on your device. As Martin Kleppmann explains:

> In local-first software, the availability of another computer should never prevent you from working.

### Key Benefits

- Instant responsiveness with offline support
- Seamless data synchronization when online
- Smart conflict handling
- Enhanced data privacy and control

For a more detailed explanation, check out my article on [What is Local-First Web Development?](https://alexop.dev/posts/what-is-local-first-web-development/)

# Technical Implementation

## Technology Stack Overview

Our application uses:

- **Vue 3** for our reactive UI layer
- **Dexie.js** to simplify IndexedDB operations
- **Dexie Cloud** for seamless sync and auth
- **PWA Support** for offline capabilities (See my guide on [Creating a PWA with Vue 3 and Vite](https://alexop.dev/posts/create-pwa-vue3-vite-4-steps/))

The core concept revolves around using Dexie Cloud to sync our local data between devices:
![dexie cloud](../../assets/images/dexie/dexie-sync.svg)

## Interactive Learning

Before diving into implementation details, try this interactive demonstration to understand sync engines:

# Setting Up Your Development Environment

## Dexie Cloud Setup

### Initial Configuration

```bash
# Create your database
npx dexie-cloud create

# Add your development URL
npx dexie-cloud whitelist http://localhost:8080
```

This generates two important files:

- `dexie-cloud.json` - Your database configuration
- `dexie-cloud.key` - Your CLI credentials

Remember to add these to `.gitignore`!

## Core Features Implementation

### 1. Data Synchronization

The sync process follows these key principles:

#### Local-First Operations

- Changes save locally immediately
- UI updates instantly
- Background sync handles the rest

#### Background Sync Management

```typescript
// Configure sync with your database
db.configureSync(databaseUrl).catch(err => {
  console.error("Failed to configure sync:", err);
});

// Monitor sync status
db.cloud.syncState.subscribe(state => {
  console.log("Sync state:", state);
});
```

### 2. Database Configuration

```ts
class Database {
  async configureSync(databaseUrl: string) {
    await this.cloud.configure({
      databaseUrl,
      requireAuth: true,
      tryUseServiceWorker: true,
    });
  }
}
```

Explanation:

- `databaseUrl` - The URL of your database
- `requireAuth` - Whether to require authentication
- `tryUseServiceWorker` - Whether to try using a service worker for background sync

### 3. Data Structure

```ts
this.version(1).stores({
  todos: "@id, title, completed, createdAt",
});
```

The `@id` command is crucial for cross-device synchronization:

- Generates globally unique IDs
- Prevents conflicts across devices
- Enables proper relationship tracking
- Maintains data integrity

### 4. Authentication System

```typescript
// Start login process
await db.cloud.login();

// Check current user
const user = db.cloud.currentUser;

// Logout when needed
await db.cloud.logout();
```

### 5. Reactive Data Management

```typescript
const todos = useObservable(
  from(liveQuery(() => db.todos.orderBy("createdAt").toArray()))
);
```

Benefits:

- Auto-updating UI
- Offline support
- Cross-device sync
- Built-in conflict handling

## Advanced Concepts

### Understanding useObservable with Live Queries

```typescript
const todos = useObservable<Todo[]>(
  from(liveQuery(() => db.todos.orderBy("createdAt").toArray()))
);
```

Key features:

- Converts RxJS observables into Vue refs
- Manages subscription lifecycle
- Ensures proper cleanup
- Triggers component re-renders automatically

### Sync Engine Architecture

# Sync Engine Architecture

## How Dexie's Sync Engine Works

Dexie's sync engine follows a relatively straightforward approach to data synchronization. Imagine it like a system of notebooks where each device has its own copy, and there's one master notebook (the server):

1. **Local Changes First**
   When you write something in your local notebook (make changes in your app), it's immediately saved on your device. This is why the app feels fast and responsive.

2. **Change Recording**
   While you're making changes, Dexie keeps a log of everything you do - like adding a new todo, marking one as complete, or deleting one. Think of it as keeping sticky notes of all your changes.

3. **Synchronization Process**
   When your device is online, Dexie tries to "copy" all your changes to the master notebook (server). At the same time, it checks if anyone else has made changes in their notebooks.

4. **Simple Conflict Resolution**
   Here's where Dexie shows its limitations. When two people change the same thing differently, Dexie uses a simple "last write wins" approach - whoever's change reached the server last becomes the "truth." This is like saying "the last person to write in the master notebook gets their way."

## Limitations and More Advanced Alternatives

While Dexie's approach works well for simple applications, it has some limitations:

1. **Conflict Resolution Weaknesses**
   - Can't merge concurrent changes intelligently
   - Might lose important updates in conflict situations
   - No way to preserve intention of different users' changes

2. **More Sophisticated Approaches**
   More advanced solutions like Automerge with CRDTs (Conflict-free Replicated Data Types) handle these situations much better. Here's how:
   - **Automerge**: Imagine a Google Docs-like experience where multiple people can edit simultaneously, and all changes merge seamlessly. It tracks not just the final state but the entire history of how data changed.
   - **CRDTs**: These are special data structures that mathematically guarantee that all devices will end up with the same data, no matter the order of changes. It's like having magical notebooks that automatically sync and merge changes in a way that makes sense.

3. **When to Use What**
   - Use Dexie when: Your app is relatively simple, conflicts are rare, and having occasional "last write wins" situations is acceptable
   - Consider CRDTs when: You need real-time collaboration, complex data merging, or cannot afford to lose any user changes

4. **Real-world Impact**
   For example, if two users are editing a todo list title simultaneously:
   - With Dexie: One person's change will be completely overwritten
   - With CRDTs: The changes could be intelligently merged to preserve both users' intentions

#### Change Tracking

```typescript
export enum DatabaseChangeType {
  Create = 1,
  Update = 2,
  Delete = 3,
}

interface DatabaseChange {
  type: DatabaseChangeType;
  table: string;
  key: string;
  mods?: Record<string, any>;
}
```

#### Change Management Example

```typescript
const change: DatabaseChange = {
  type: DatabaseChangeType.Update,
  table: "todos",
  key: "todo-123",
  mods: {
    completed: true,
    updatedAt: "2025-01-11T12:00:00Z",
  },
};
```

#### Conflict Resolution Strategy

- Server changes take priority
- Deletions override updates
- Duplicate creates merge automatically

# Getting Started

Ready to build your own local-first app? Here's how to begin:

1. Clone the [example repo](https://github.com/alexanderop/vue-dexie)
2. Explore the [Dexie.js docs](https://dexie.org/)
3. Check out [Dexie Cloud features](https://dexie.org/cloud/docs/)

Note: While Dexie.js offers a solid solution for local-first applications, it's not the only option available. For more advanced conflict resolution and sync capabilities, consider exploring CRDT-based solutions. Check out the [awesome-local-first](https://github.com/alexanderop/awesome-local-first) repository for alternatives.
