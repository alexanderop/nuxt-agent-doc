<script setup lang="ts">
const links = [
  { label: 'Blog', to: '/blog' },
  { label: 'Notes', to: '/notes' },
  { label: 'TIL', to: '/til' }
]
const chatOpen = useChatSlideover()
</script>

<template>
  <header class="border-b border-default sticky top-0 bg-default/80 backdrop-blur z-10">
    <UContainer class="flex items-center justify-between py-3">
      <NuxtLink to="/" class="font-semibold text-lg">
        alexop.dev
      </NuxtLink>
      <nav class="flex items-center gap-1">
        <UButton v-for="l in links" :key="l.to" :to="l.to" variant="ghost" color="neutral">
          {{ l.label }}
        </UButton>
      </nav>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-sparkles"
          color="neutral"
          variant="ghost"
          aria-label="Ask my blog"
          @click="chatOpen = true"
        >
          Ask my blog
        </UButton>
        <UColorModeButton />
      </div>
    </UContainer>
  </header>
</template>
