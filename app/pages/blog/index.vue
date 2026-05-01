<script setup lang="ts">
const { data: posts } = await useAsyncData('all-posts', () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .order('pubDatetime', 'DESC')
    .all()
)

useHead({ title: 'Blog — alexop.dev' })
</script>

<template>
  <UContainer class="py-12 max-w-2xl">
    <h1 class="text-3xl font-semibold mb-8">
      Blog
    </h1>
    <ul class="space-y-6">
      <li v-for="p in posts" :key="p.path">
        <PostListItem :post="p" />
      </li>
    </ul>
  </UContainer>
</template>
