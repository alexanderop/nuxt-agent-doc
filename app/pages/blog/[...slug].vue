<script setup lang="ts">
const route = useRoute()
const { data: post } = await useAsyncData(route.path, () =>
  queryCollection('blog').where('path', '=', route.path).first()
)
if (!post.value) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

useHead({
  title: `${post.value.title} — alexop.dev`,
  meta: [{ name: 'description', content: post.value.description }]
})
</script>

<template>
  <UContainer v-if="post" class="py-12 max-w-2xl">
    <article>
      <h1 class="text-4xl font-semibold mb-3">
        {{ post.title }}
      </h1>
      <PostMeta
        :pub-datetime="post.pubDatetime"
        :tags="post.tags"
        :author="post.author"
        class="mb-10"
      />
      <ContentRenderer :value="post" class="prose dark:prose-invert max-w-none" />
    </article>
  </UContainer>
</template>
