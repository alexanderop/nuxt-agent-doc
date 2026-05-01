<script setup lang="ts">
defineProps<{
  pubDatetime: string | Date
  tags?: string[]
  author?: string
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
    <span>
      {{ new Date(pubDatetime).toLocaleDateString('en-US', { dateStyle: 'long' }) }}
    </span>
    <template v-if="author">
      <span class="hidden sm:inline">·</span>
      <span class="hidden sm:inline">{{ author }}</span>
    </template>
    <div v-if="tags?.length" class="flex flex-wrap gap-1">
      <NuxtLink
        v-for="t in tags"
        :key="t"
        :to="`/tags/${t}`"
      >
        <UBadge color="neutral" variant="soft" size="sm">
          {{ t }}
        </UBadge>
      </NuxtLink>
    </div>
  </div>
</template>
