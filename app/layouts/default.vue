<script setup lang="ts">
const chatOpen = useChatSlideover()
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-inverted focus:font-medium focus:outline-none focus:ring-2 focus:ring-primary"
    >
      Skip to main content
    </a>
    <AppHeader />
    <main id="main-content" tabindex="-1" class="flex-1 outline-none">
      <slot />
    </main>
    <AppFooter />
    <LazyChatSlideover v-if="chatOpen" />
  </div>
</template>
