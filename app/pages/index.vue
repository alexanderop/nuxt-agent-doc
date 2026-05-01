<script setup lang="ts">
const { data: recent } = await useAsyncData('recent-posts', () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .order('pubDatetime', 'DESC')
    .limit(5)
    .all()
)

useHead({ title: 'Alexander Opalic — alexop.dev' })
</script>

<template>
  <UContainer class="py-16 max-w-2xl">
    <h1 class="text-4xl font-semibold mb-4">
      Hi, I'm Alex.
    </h1>
    <p class="text-lg text-muted mb-12">
      I write about Vue, Nuxt, AI, and how I work.
    </p>
    <h2 class="text-sm font-medium uppercase tracking-wide text-muted mb-4">
      Recent posts
    </h2>
    <ul class="space-y-4">
      <li v-for="p in recent" :key="p.path">
        <PostListItem :post="p" />
      </li>
    </ul>
    <UButton to="/blog" color="neutral" variant="ghost" trailing-icon="i-lucide-arrow-right" class="mt-6">
      All posts
    </UButton>
  </UContainer>
</template>
