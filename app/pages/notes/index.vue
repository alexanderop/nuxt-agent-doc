<script setup lang="ts">
const { data: notes } = await useAsyncData('all-notes', () =>
  queryCollection('notes')
    .where('draft', '=', false)
    .order('pubDatetime', 'DESC')
    .all()
)

useHead({ title: 'Notes — alexop.dev' })

const sourceTypeLabel: Record<string, string> = {
  book: 'Book',
  video: 'Video',
  article: 'Article',
  podcast: 'Podcast',
  other: 'Other'
}
</script>

<template>
  <UContainer class="py-12 max-w-2xl">
    <h1 class="text-3xl font-semibold mb-2">
      Notes
    </h1>
    <p class="text-muted mb-8">
      Reviews and highlights from books, articles, talks, and podcasts.
    </p>
    <ul class="space-y-6">
      <li v-for="n in notes" :key="n.path">
        <NuxtLink :to="n.path" class="block group">
          <div class="text-xs text-muted flex items-center gap-2">
            <span>{{ new Date(n.pubDatetime).toLocaleDateString('en-US', { dateStyle: 'medium' }) }}</span>
            <span>·</span>
            <span>{{ sourceTypeLabel[n.sourceType] ?? n.sourceType }}</span>
            <span v-if="n.rating" class="text-amber-500" aria-label="rating">
              {{ '★'.repeat(n.rating) }}<span class="text-muted">{{ '☆'.repeat(5 - n.rating) }}</span>
            </span>
          </div>
          <div class="text-lg font-medium group-hover:text-primary transition">
            {{ n.title }}
          </div>
          <p class="text-sm text-muted">
            by {{ n.sourceAuthor }}
          </p>
          <p class="text-sm text-muted line-clamp-2">
            {{ n.description }}
          </p>
        </NuxtLink>
      </li>
    </ul>
  </UContainer>
</template>
