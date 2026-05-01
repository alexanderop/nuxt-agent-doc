<script setup lang="ts">
const route = useRoute()
const tag = computed(() => String(route.params.tag))

const { data: posts } = await useAsyncData(() => `tag-${tag.value}`, () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .where('tags', 'LIKE', `%"${tag.value}"%`)
    .order('pubDatetime', 'DESC')
    .all(),
{ watch: [tag] }
)

useHead({ title: `#${tag.value} — alexop.dev` })
</script>

<template>
  <UContainer class="py-12 max-w-2xl">
    <h1 class="text-3xl font-semibold mb-8">
      <span class="text-muted">#</span>{{ tag }}
    </h1>
    <ul v-if="posts?.length" class="space-y-6">
      <li v-for="p in posts" :key="p.path">
        <PostListItem :post="p" />
      </li>
    </ul>
    <p v-else class="text-muted">
      No posts found for this tag.
    </p>
  </UContainer>
</template>
