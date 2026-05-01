---
author: Alexander Opalic
pubDatetime: 2024-01-28T15:22:00Z
modDatetime: 2024-01-28T15:22:00Z
title: "How to Write Clean Vue Components"
slug: how-to-write-clean-vue-components
draft: false
tags:
  - vue
  - architecture
description: "There are many ways to write better Vue components. One of my favorite ways is to separate business logic into pure functions."
---

## Table of Contents

## Introduction

Writing code that's both easy to test and easy to read can be a challenge, with Vue components. In this blog post, I'm going to share a design idea that will make your Vue components better. This method won't speed up your code, but it will make it simpler to test and understand. Think of it as a big-picture way to improve your Vue coding style. It's going to make your life easier when you need to fix or update your components.

Whether you're new to Vue or have been using it for some time, this tip will help you make your Vue components cleaner and more straightforward.

---

## Understanding Vue Components

A Vue component is like a reusable puzzle piece in your app. It has three main parts:

1. **View**: This is the template section where you design the user interface.
2. **Reactivity**: Here, Vue's features like `ref` make the interface interactive.
3. **Business Logic**: This is where you process data or manage user actions.

![Architecture](../../assets/images/how-to-write-clean-vue-components/architecture.png)

---

## Case Study: `snakeGame.vue`

Let's look at a common Vue component, `snakeGame.vue`. It mixes the view, reactivity, and business logic, which can make it complex and hard to work with.

### Code Sample: Traditional Approach

```vue
<template>
  <div class="game-container">
    <canvas ref="canvas" width="400" height="400"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const canvas = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
let snake = [{ x: 200, y: 200 }];
let direction = { x: 0, y: 0 };
let lastDirection = { x: 0, y: 0 };
let food = { x: 0, y: 0 };
const gridSize = 20;
let gameInterval: number | null = null;

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext("2d");
    resetFoodPosition();
    gameInterval = window.setInterval(gameLoop, 100);
  }
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  if (gameInterval !== null) {
    window.clearInterval(gameInterval);
  }
  window.removeEventListener("keydown", handleKeydown);
});

function handleKeydown(e: KeyboardEvent) {
  e.preventDefault();
  switch (e.key) {
    case "ArrowUp":
      if (lastDirection.y !== 0) break;
      direction = { x: 0, y: -gridSize };
      break;
    case "ArrowDown":
      if (lastDirection.y !== 0) break;
      direction = { x: 0, y: gridSize };
      break;
    case "ArrowLeft":
      if (lastDirection.x !== 0) break;
      direction = { x: -gridSize, y: 0 };
      break;
    case "ArrowRight":
      if (lastDirection.x !== 0) break;
      direction = { x: gridSize, y: 0 };
      break;
  }
}

function gameLoop() {
  updateSnakePosition();
  if (checkCollision()) {
    endGame();
    return;
  }
  checkFoodCollision();
  draw();
  lastDirection = { ...direction };
}

function updateSnakePosition() {
  for (let i = snake.length - 2; i >= 0; i--) {
    snake[i + 1] = { ...snake[i] };
  }
  snake[0].x += direction.x;
  snake[0].y += direction.y;
}

function checkCollision() {
  return (
    snake[0].x < 0 ||
    snake[0].x >= 400 ||
    snake[0].y < 0 ||
    snake[0].y >= 400 ||
    snake
      .slice(1)
      .some(segment => segment.x === snake[0].x && segment.y === snake[0].y)
  );
}

function checkFoodCollision() {
  if (snake[0].x === food.x && snake[0].y === food.y) {
    snake.push({ ...snake[snake.length - 1] });
    resetFoodPosition();
  }
}

function resetFoodPosition() {
  food = {
    x: Math.floor(Math.random() * 20) * gridSize,
    y: Math.floor(Math.random() * 20) * gridSize,
  };
}

function draw() {
  if (!ctx.value) return;
  ctx.value.clearRect(0, 0, 400, 400);
  drawGrid();
  drawSnake();
  drawFood();
}

function drawGrid() {
  if (!ctx.value) return;
  ctx.value.strokeStyle = "#ddd";
  for (let i = 0; i <= 400; i += gridSize) {
    ctx.value.beginPath();
    ctx.value.moveTo(i, 0);
    ctx.value.lineTo(i, 400);
    ctx.value.stroke();
    ctx.value.moveTo(0, i);
    ctx.value.lineTo(400, i);
    ctx.value.stroke();
  }
}

function drawSnake() {
  if (!ctx.value) return;
  ctx.value.fillStyle = "green";
  snake.forEach(segment => {
    ctx.value?.fillRect(segment.x, segment.y, gridSize, gridSize);
  });
}

function drawFood() {
  if (!ctx.value) return;
  ctx.value.fillStyle = "red";
  ctx.value.fillRect(food.x, food.y, gridSize, gridSize);
}

function endGame() {
  if (gameInterval !== null) {
    window.clearInterval(gameInterval);
  }
  alert("Game Over");
}
</script>

<style>
.game-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>
```

### Screenshot from the game

![Snake Game Screenshot](./../../assets/images/how-to-write-clean-vue-components/snakeGameImage.png)

### Challenges with the Traditional Approach

When you mix the view, reactivity, and business logic all in one file, the component becomes bulky and hard to maintain. Unit tests become more complex, requiring integration tests for comprehensive coverage.

---

## Introducing the Functional Core, Imperative Shell Pattern

To solve these problems in Vue, we use the "Functional Core, Imperative Shell" pattern. This pattern is key in software architecture and helps you structure your code better:

> **Functional Core, Imperative Shell Pattern**: In this design, the main logic of your app (the 'Functional Core') stays pure and without side effects, making it testable. The 'Imperative Shell' handles the outside world, like the UI or databases, and talks to the pure core.

![Functional core Diagram](./../../assets/images/how-to-write-clean-vue-components/functional-core-diagram.png)

### What Are Pure Functions?

In this pattern, **pure functions** are at the heart of the 'Functional Core'. A pure function is a concept from functional programming, and it has two key characteristics:

1. **Predictability**: If you give a pure function the same inputs, it always gives back the same output.
2. **No Side Effects**: Pure functions don't change anything outside them. They don't alter external variables, call APIs, or do any input/output.

Pure functions simplify testing, debugging, and code comprehension. They form the foundation of the Functional Core, keeping your app's business logic clean and manageable.

---

### Applying the Pattern in Vue

In Vue, this pattern has two parts:

- **Imperative Shell** (`useGameSnake.ts`): This part handles the Vue-specific reactive bits. It's where your components interact with Vue, managing operations like state changes and events.
- **Functional Core** (`pureGameSnake.ts`): This is where your pure business logic lives. It's separate from Vue, which makes it easier to test and think about your app's main functions, independent of the UI.

---

### Implementing `pureGameSnake.ts`

The `pureGameSnake.ts` file encapsulates the game's business logic without any Vue-specific reactivity. This separation means easier testing and clearer logic.

```typescript
export const gridSize = 20;

interface Position {
  x: number;
  y: number;
}

type Snake = Position[];

export function initializeSnake(): Snake {
  return [{ x: 200, y: 200 }];
}

export function moveSnake(snake: Snake, direction: Position): Snake {
  return snake.map((segment, index) => {
    if (index === 0) {
      return { x: segment.x + direction.x, y: segment.y + direction.y };
    }
    return { ...snake[index - 1] };
  });
}

export function isCollision(snake: Snake): boolean {
  const head = snake[0];
  return (
    head.x < 0 ||
    head.x >= 400 ||
    head.y < 0 ||
    head.y >= 400 ||
    snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
  );
}

export function randomFoodPosition(): Position {
  return {
    x: Math.floor(Math.random() * 20) * gridSize,
    y: Math.floor(Math.random() * 20) * gridSize,
  };
}

export function isFoodEaten(snake: Snake, food: Position): boolean {
  const head = snake[0];
  return head.x === food.x && head.y === food.y;
}
```

### Implementing `useGameSnake.ts`

In `useGameSnake.ts`, we manage the Vue-specific state and reactivity, leveraging the pure functions from `pureGameSnake.ts`.

```typescript
import { onMounted, onUnmounted, ref, Ref } from "vue";
import * as GameLogic from "./pureGameSnake";

interface Position {
  x: number;
  y: number;
}

type Snake = Position[];

interface GameState {
  snake: Ref<Snake>;
  direction: Ref<Position>;
  food: Ref<Position>;
  gameState: Ref<"over" | "playing">;
}

export function useGameSnake(): GameState {
  const snake: Ref<Snake> = ref(GameLogic.initializeSnake());
  const direction: Ref<Position> = ref({ x: 0, y: 0 });
  const food: Ref<Position> = ref(GameLogic.randomFoodPosition());
  const gameState: Ref<"over" | "playing"> = ref("playing");
  let gameInterval: number | null = null;

  const startGame = (): void => {
    gameInterval = window.setInterval(() => {
      snake.value = GameLogic.moveSnake(snake.value, direction.value);

      if (GameLogic.isCollision(snake.value)) {
        gameState.value = "over";
        if (gameInterval !== null) {
          clearInterval(gameInterval);
        }
      } else if (GameLogic.isFoodEaten(snake.value, food.value)) {
        snake.value.push({ ...snake.value[snake.value.length - 1] });
        food.value = GameLogic.randomFoodPosition();
      }
    }, 100);
  };

  onMounted(startGame);

  onUnmounted(() => {
    if (gameInterval !== null) {
      clearInterval(gameInterval);
    }
  });

  return { snake, direction, food, gameState };
}
```

### Refactoring `gameSnake.vue`

Now, our `gameSnake.vue` is more focused, using `useGameSnake.ts` for managing state and reactivity, while the view remains within the template.

```vue
<template>
  <div class="game-container">
    <canvas ref="canvas" width="400" height="400"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from "vue";
import { useGameSnake } from "./useGameSnake.ts";
import { gridSize } from "./pureGameSnake";

const { snake, direction, food, gameState } = useGameSnake();
const canvas = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
let lastDirection = { x: 0, y: 0 };

onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext("2d");
    draw();
  }
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

watch(gameState, state => {
  if (state === "over") {
    alert("Game Over");
  }
});

function handleKeydown(e: KeyboardEvent) {
  e.preventDefault();
  switch (e.key) {
    case "ArrowUp":
      if (lastDirection.y !== 0) break;
      direction.value = { x: 0, y: -gridSize };
      break;
    case "ArrowDown":
      if (lastDirection.y !== 0) break;
      direction.value = { x: 0, y: gridSize };
      break;
    case "ArrowLeft":
      if (lastDirection.x !== 0) break;
      direction.value = { x: -gridSize, y: 0 };
      break;
    case "ArrowRight":
      if (lastDirection.x !== 0) break;
      direction.value = { x: gridSize, y: 0 };
      break;
  }
  lastDirection = { ...direction.value };
}

watch(
  [snake, food],
  () => {
    draw();
  },
  { deep: true }
);

function draw() {
  if (!ctx.value) return;
  ctx.value.clearRect(0, 0, 400, 400);
  drawGrid();
  drawSnake();
  drawFood();
}

function drawGrid() {
  if (!ctx.value) return;
  ctx.value.strokeStyle = "#ddd";
  for (let i = 0; i <= 400; i += gridSize) {
    ctx.value.beginPath();
    ctx.value.moveTo(i, 0);
    ctx.value.lineTo(i, 400);
    ctx.value.stroke();
    ctx.value.moveTo(0, i);
    ctx.value.lineTo(400, i);
    ctx.value.stroke();
  }
}

function drawSnake() {
  ctx.value.fillStyle = "green";
  snake.value.forEach(segment => {
    ctx.value.fillRect(segment.x, segment.y, gridSize, gridSize);
  });
}

function drawFood() {
  ctx.value.fillStyle = "red";
  ctx.value.fillRect(food.value.x, food.value.y, gridSize, gridSize);
}
</script>

<style>
.game-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>
```

---

## Advantages of the Functional Core, Imperative Shell Pattern

The Functional Core, Imperative Shell pattern enhances the **testability** and **maintainability** of Vue components. By separating the business logic from the framework-specific code, this pattern offers key advantages:

### Simplified Testing

Business logic combined with Vue's reactivity and component structure makes testing complex. Traditional unit testing becomes challenging, leading to integration tests that lack precision. By extracting the core logic into pure functions (as in `pureGameSnake.ts`), we write focused unit tests for each function. This isolation streamlines testing, as each piece of logic operates independently of Vue's reactivity system.

### Enhanced Maintainability

The Functional Core, Imperative Shell pattern creates a clear **separation of concerns**. Vue components focus on the user interface and reactivity, while the pure business logic lives in separate, framework-agnostic files. This separation improves code readability and understanding. Maintenance becomes straightforward as the application grows.

### Framework Agnosticism

A key advantage of this pattern is the **portability** of your business logic. The pure functions in the Functional Core remain independent of any UI framework. If you need to switch from Vue to another framework, or if Vue changes, your core logic remains intact. This flexibility protects your code against changes and shifts in technology.

## Testing Complexities in Traditional Vue Components vs. Functional Core, Imperative Shell Pattern

### Challenges in Testing Traditional Components

Testing traditional Vue components, where view, reactivity, and business logic combine, presents specific challenges. In such components, unit tests face these obstacles:

- Tests function more like integration tests, reducing precision
- Vue's reactivity system creates complex mocking requirements
- Test coverage must span reactive behavior and side effects

These challenges reduce confidence in tests and component stability.

### Simplified Testing with Functional Core, Imperative Shell Pattern

The Functional Core, Imperative Shell pattern transforms testing:

- **Isolated Business Logic**: Pure functions in the Functional Core enable direct unit tests without Vue's reactivity or component states.
- **Predictable Outcomes**: Pure functions deliver consistent outputs for given inputs.
- **Clear Separation**: The reactive and side-effect code stays in the Imperative Shell, enabling focused testing of Vue interactions.

This approach creates a modular, testable codebase where each component undergoes thorough testing, improving reliability.

---

### Conclusion

The Functional Core, Imperative Shell pattern strengthens Vue applications through improved testing and maintenance. It prepares your code for future changes and growth. While restructuring requires initial effort, the pattern delivers long-term benefits, making it valuable for Vue developers aiming to enhance their application's architecture and quality.

![Blog Conclusion Diagram](./../../assets/images/how-to-write-clean-vue-components/conclusionDiagram.png)
