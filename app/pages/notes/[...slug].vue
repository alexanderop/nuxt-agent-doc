<script setup lang="ts">
const route = useRoute()
const { data: note } = await useAsyncData(route.path, () =>
  queryCollection('notes').where('path', '=', route.path).first()
)
if (!note.value) throw createError({ statusCode: 404, statusMessage: 'Note not found' })

useHead({
  title: `${note.value.title} — alexop.dev`,
  meta: [{ name: 'description', content: note.value.description }]
})
</script>

<template>
  <UContainer v-if="note" class="py-12 max-w-2xl">
    <article>
      <img
        v-if="note.cover"
        :src="note.cover"
        :alt="`Cover for ${note.title}`"
        class="rounded-lg mb-6 max-h-64 object-cover"
      >
      <h1 class="text-4xl font-semibold mb-3">
        {{ note.title }}
      </h1>
      <p class="text-muted mb-2">
        <span class="capitalize">{{ note.sourceType }}</span> by
        <ULink v-if="note.sourceUrl" :to="note.sourceUrl" target="_blank" rel="noopener" class="underline">
          {{ note.sourceAuthor }}
        </ULink>
        <span v-else>{{ note.sourceAuthor }}</span>
      </p>
      <div v-if="note.rating" class="text-amber-500 mb-4" :aria-label="`Rated ${note.rating} out of 5`">
        {{ '★'.repeat(note.rating) }}<span class="text-muted">{{ '☆'.repeat(5 - note.rating) }}</span>
      </div>
      <PostMeta
        :pub-datetime="note.pubDatetime"
        :tags="note.tags"
        :author="note.author"
        class="mb-10"
      />
      <ContentRenderer :value="note" class="prose dark:prose-invert max-w-none" />
    </article>
  </UContainer>
</template>
