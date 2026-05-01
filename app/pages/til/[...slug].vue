<script setup lang="ts">
const route = useRoute()
const { data: til } = await useAsyncData(route.path, () =>
  queryCollection('til').where('path', '=', route.path).first()
)
if (!til.value) throw createError({ statusCode: 404, statusMessage: 'TIL not found' })

useHead({
  title: `${til.value.title} — alexop.dev`,
  meta: til.value.description ? [{ name: 'description', content: til.value.description }] : []
})
</script>

<template>
  <UContainer v-if="til" class="py-12 max-w-2xl">
    <article>
      <h1 class="text-4xl font-semibold mb-3">
        {{ til.title }}
      </h1>
      <PostMeta
        :pub-datetime="til.pubDatetime"
        :tags="til.tags"
        :author="til.author"
        class="mb-10"
      />
      <ContentRenderer :value="til" class="prose dark:prose-invert max-w-none" />
    </article>
  </UContainer>
</template>
