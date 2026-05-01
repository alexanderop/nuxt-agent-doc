<script setup lang="ts">
const { post } = defineProps<{
  post: {
    title: string
    description: string
    path: string
    pubDatetime: string | Date
    tags?: string[]
  }
}>()
</script>

<template>
  <NuxtLink :to="post.path" class="block group">
    <div class="text-xs text-muted">
      {{ new Date(post.pubDatetime).toLocaleDateString('en-US', { dateStyle: 'medium' }) }}
    </div>
    <div class="text-lg font-medium group-hover:underline">
      {{ post.title }}
    </div>
    <p class="text-sm text-muted line-clamp-2">
      {{ post.description }}
    </p>
  </NuxtLink>
</template>
