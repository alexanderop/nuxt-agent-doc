<script setup lang="ts">
const { data: tils } = await useAsyncData('all-til', () =>
  queryCollection('til')
    .where('draft', '=', false)
    .order('pubDatetime', 'DESC')
    .all()
)

useHead({ title: 'TIL — alexop.dev' })
</script>

<template>
  <UContainer class="py-12 max-w-2xl">
    <h1 class="text-3xl font-semibold mb-2">
      Today I Learned
    </h1>
    <p class="text-muted mb-8">
      Short notes about things I figured out recently.
    </p>
    <ul class="space-y-6">
      <li v-for="t in tils" :key="t.path">
        <PostListItem
          :post="{
            title: t.title,
            description: t.description ?? '',
            path: t.path,
            pubDatetime: t.pubDatetime,
            tags: t.tags
          }"
        />
      </li>
    </ul>
  </UContainer>
</template>
