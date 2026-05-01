<script setup lang="ts">
defineProps<{
  title: string
  slug: string
  description: string
  tags: string[]
  pubDatetime: string
}>()
</script>

<template>
  <NuxtLink :to="slug" class="not-prose block">
    <UCard class="hover:border-primary transition">
      <div class="text-xs text-muted mb-1">
        {{ new Date(pubDatetime).toLocaleDateString('en-US', { dateStyle: 'medium' }) }}
      </div>
      <div class="font-semibold">{{ title }}</div>
      <p class="text-sm text-muted mt-1 line-clamp-2">{{ description }}</p>
      <div v-if="tags?.length" class="flex flex-wrap gap-1 mt-3">
        <UBadge v-for="t in tags" :key="t" color="neutral" variant="soft" size="sm">
          {{ t }}
        </UBadge>
      </div>
    </UCard>
  </NuxtLink>
</template>
