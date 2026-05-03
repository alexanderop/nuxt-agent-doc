<script setup lang="ts">
const { data: files } = useLazyAsyncData(
  'content-search',
  async () => {
    const [blog, notes, til] = await Promise.all([
      queryCollectionSearchSections('blog'),
      queryCollectionSearchSections('notes'),
      queryCollectionSearchSections('til')
    ])
    return [...blog, ...notes, ...til]
  },
  { server: false }
)

const searchTerm = ref('')
</script>

<template>
  <ClientOnly>
    <LazyUContentSearch
      v-model:search-term="searchTerm"
      :files="files ?? []"
      :fuse="{ resultLimit: 42 }"
    />
  </ClientOnly>
</template>
