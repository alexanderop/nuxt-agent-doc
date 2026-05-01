<template>
  <footer class="border-t border-default py-8 text-sm text-muted">
    <UContainer class="flex justify-between">
      <span>© {{ new Date().getFullYear() }} Alexander Opalic</span>
      <NuxtLink to="/rss.xml" class="hover:text-default" external>RSS</NuxtLink>
    </UContainer>
  </footer>
</template>
