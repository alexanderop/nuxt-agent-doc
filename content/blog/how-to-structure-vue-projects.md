---
author: Alexander Opalic
pubDatetime: 2024-05-12T15:22:00Z
modDatetime: 2025-02-09T00:00:00Z
title: "How to Structure Vue Projects"
slug: how-to-structure-vue-projects
draft: false
tags:
  - vue
  - architecture
seriesTag: vue-architecture
seriesTitle: "Vue Architecture Guide"
description: "Discover best practices for structuring Vue projects of any size, from simple apps to complex enterprise solutions."
---

## Quick Summary

This post covers specific Vue project structures suited for different project sizes:

- Flat structure for small projects
- Atomic Design for scalable applications
- Modular approach for larger projects
- Feature Sliced Design for complex applications
- Micro frontends for enterprise-level solutions

## Table of Contents

## Introduction

When starting a Vue project, one of the most critical decisions you'll make is how to structure it. The right structure enhances scalability, maintainability, and collaboration within your team. This consideration aligns with **Conway's Law**:

> "Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations."  
> — Mel Conway

In essence, your Vue application's architecture will reflect your organization's structure, influencing how you should plan your project's layout.

![Diagram of Conway's Law](../../assets/images/how-to-structure-vue/conway.png)

Whether you're building a small app or an enterprise-level solution, this guide covers specific project structures suited to different scales and complexities.

---

## 1. Flat Structure: Perfect for Small Projects

Are you working on a small-scale Vue project or a proof of concept? A simple, flat folder structure might be the best choice to keep things straightforward and avoid unnecessary complexity.

### Pros and Cons

<div class="overflow-x-auto">
  <table class="custom-table">
    <thead>
      <tr>
        <th>✅ Pros</th>
        <th>❌ Cons</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Easy to implement</td>
        <td>Not scalable</td>
      </tr>
      <tr>
        <td>Minimal setup</td>
        <td>Becomes cluttered as the project grows</td>
      </tr>
      <tr>
        <td>Ideal for small teams or solo developers</td>
        <td>Lack of clear separation of concerns</td>
      </tr>
    </tbody>
  </table>
</div>

---

## 2. Atomic Design: Scalable Component Organization

![Atomic Design Diagram](../../assets/images/atomic/diagram.svg)

For larger Vue applications, Atomic Design provides a clear structure. This approach organizes components into a hierarchy from simplest to most complex.

### The Atomic Hierarchy

- **Atoms:** Basic elements like buttons and icons.
- **Molecules:** Groups of atoms forming simple components (e.g., search bars).
- **Organisms:** Complex components made up of molecules and atoms (e.g., navigation bars).
- **Templates:** Page layouts that structure organisms without real content.
- **Pages:** Templates filled with real content to form actual pages.

This method ensures scalability and maintainability, facilitating a smooth transition between simple and complex components.

### Pros and Cons

<div class="overflow-x-auto">
  <table class="custom-table">
    <thead>
      <tr>
        <th>✅ Pros</th>
        <th>❌ Cons</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Highly scalable</td>
        <td>Can introduce overhead in managing layers</td>
      </tr>
      <tr>
        <td>Organized component hierarchy</td>
        <td>Initial complexity in setting up</td>
      </tr>
      <tr>
        <td>Reusable components</td>
        <td>Might be overkill for smaller projects</td>
      </tr>
      <tr>
        <td>Improves collaboration among teams</td>
        <td></td>
      </tr>
    </tbody>
  </table>
</div>

> 
  Check out my detailed blog post on [Atomic Design in Vue and
  Nuxt](../atomic-design-vue-or-nuxt).

---

## 3. Modular Approach: Feature-Based Organization

As your project scales, consider a **Modular Monolithic Architecture**. This structure encapsulates each feature or domain, enhancing maintainability and preparing for potential evolution towards microservices.

### Alternative: Simplified Flat Feature Structure

A common pain point in larger projects is excessive folder nesting, which can make navigation and file discovery more difficult. Here's a simplified, flat feature structure that prioritizes IDE-friendly navigation and reduces cognitive load:

This structure offers key advantages:

- **Quick Navigation**: Using IDE features like "Quick Open" (Ctrl/Cmd + P), you can find any project-related file by typing "project..."
- **Reduced Nesting**: All feature-related files are at the same level, eliminating deep folder hierarchies
- **Clear Ownership**: Each file's name indicates its purpose
- **Pattern Recognition**: Consistent naming makes it simple to understand each file's role
- **Test Colocation**: Tests live right next to the code they're testing

---

## 4. Feature-Sliced Design: For Complex Applications

**Feature-Sliced Design** is ideal for big, long-term projects. This approach breaks the application into different layers, each with a specific role.

![Feature-Sliced Design Diagram](../../assets/images/how-to-structure-vue/feature-sliced.png)

### Layers of Feature-Sliced Design

- **App:** Global settings, styles, and providers.
- **Processes:** Global business processes, like user authentication flows.
- **Pages:** Full pages built using entities, features, and widgets.
- **Widgets:** Combines entities and features into cohesive UI blocks.
- **Features:** Handles user interactions that add value.
- **Entities:** Represents core business models.
- **Shared:** Reusable utilities and components unrelated to specific business logic.

### Pros and Cons

<div class="overflow-x-auto">
  <table class="custom-table">
    <thead>
      <tr>
        <th>✅ Pros</th>
        <th>❌ Cons</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>High cohesion and clear separation</td>
        <td>Initial complexity in understanding the layers</td>
      </tr>
      <tr>
        <td>Scalable and maintainable</td>
        <td>Requires thorough planning</td>
      </tr>
      <tr>
        <td>Facilitates team collaboration</td>
        <td>Needs consistent enforcement of conventions</td>
      </tr>
    </tbody>
  </table>
</div>

> 
  Visit the [official Feature-Sliced Design
  documentation](https://feature-sliced.design/) for an in-depth understanding.

---

## 5. Micro Frontends: Enterprise-Level Solution

**Micro frontends** apply the microservices concept to frontend development. Teams can work on distinct sections of a web app independently, enabling flexible development and deployment.

![Micro Frontend Diagram](../../assets/images/how-to-structure-vue/microfrontend.png)

### Key Components

- **Application Shell:** The main controller handling basic layout and routing, connecting all micro frontends.
- **Decomposed UIs:** Each micro frontend focuses on a specific part of the application using its own technology stack.

### Pros and Cons

<div class="overflow-x-auto">
  <table class="custom-table">
    <thead>
      <tr>
        <th>✅ Pros</th>
        <th>❌ Cons</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Independent deployments</td>
        <td>High complexity in orchestration</td>
      </tr>
      <tr>
        <td>Scalability across large teams</td>
        <td>Requires robust infrastructure</td>
      </tr>
      <tr>
        <td>Technology-agnostic approach</td>
        <td>Potential inconsistencies in user experience</td>
      </tr>
    </tbody>
  </table>
</div>

> 
  Micro frontends are best suited for large, complex projects with multiple
  development teams. This approach can introduce significant complexity and is
  usually not necessary for small to medium-sized applications.

> 
  Want to learn how to actually implement microfrontends with Vue? Check out my
  comprehensive guide: [How to build Microfrontends with Module Federation and
  Vue](../how-to-build-microfrontends-with-module-federation-and-vue) - includes
  working code, architectural decisions, and a complete reference project.

---

## Conclusion

![Conclusion](../../assets/images/how-to-structure-vue/conclusion.png)

Selecting the right project structure depends on your project's size, complexity, and team organization. The more complex your team or project is, the more you should aim for a structure that facilitates scalability and maintainability.

Your project's architecture should grow with your organization, providing a solid foundation for future development.

### Comparison Chart

<div class="overflow-x-auto">
  <table class="custom-table">
    <thead>
      <tr>
        <th>Approach</th>
        <th>Description</th>
        <th>✅ Pros</th>
        <th>❌ Cons</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Flat Structure</strong>
        </td>
        <td>Simple structure for small projects</td>
        <td>Easy to implement</td>
        <td>Not scalable, can become cluttered</td>
      </tr>
      <tr>
        <td>
          <strong>Atomic Design</strong>
        </td>
        <td>Hierarchical component-based structure</td>
        <td>Scalable, organized, reusable components</td>
        <td>Overhead in managing layers, initial complexity</td>
      </tr>
      <tr>
        <td>
          <strong>Modular Approach</strong>
        </td>
        <td>Feature-based modular structure</td>
        <td>Scalable, encapsulated features</td>
        <td>Potential duplication, requires discipline</td>
      </tr>
      <tr>
        <td>
          <strong>Feature-Sliced Design</strong>
        </td>
        <td>Functional layers and slices for large projects</td>
        <td>High cohesion, clear separation</td>
        <td>Initial complexity, requires thorough planning</td>
      </tr>
      <tr>
        <td>
          <strong>Micro Frontends</strong>
        </td>
        <td>Independent deployments of frontend components</td>
        <td>Independent deployments, scalable</td>
        <td>High complexity, requires coordination between teams</td>
      </tr>
    </tbody>
  </table>
</div>

---

## General Rules and Best Practices

Before concluding, let's highlight some general rules you can apply to every structure. These guidelines are important for maintaining consistency and readability in your codebase.

### Base Component Names

Use a prefix for your UI components to distinguish them from other components.

**Bad:**

**Good:**

### Related Component Names

Group related components together by naming them accordingly.

**Bad:**

**Good:**

### Order of Words in Component Names

Component names should start with the highest-level words and end with descriptive modifiers.

**Bad:**

**Good:**

### Organizing Tests

Decide whether to keep your tests in a separate folder or alongside your components. Both approaches are valid, but consistency is key.

#### Approach 1: Separate Test Folder

#### Approach 2: Inline Test Files

---

## Additional Resources

- [Official Vue.js Style Guide](https://vuejs.org/style-guide/)
- [Micro Frontends - Extending Microservice Ideas to Frontend Development](https://micro-frontends.org/)
- [Martin Fowler on Micro Frontends](https://martinfowler.com/articles/micro-frontends.html)
- [Official Feature-Sliced Design Documentation](https://feature-sliced.design/)

---
