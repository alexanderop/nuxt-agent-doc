<script setup lang="ts">
definePageMeta({
  layout: 'chat'
})

useHead({
  title: 'Ask my blog · Agent'
})

const store = useAgentChatStore()
const {
  messages,
  canClear
} = storeToRefs(store)
const {
  ask,
  clear,
  collapseToSidebar,
  faqQuestions
} = store
</script>

<template>
  <ClientOnly>
    <div class="flex-1 flex flex-col min-h-0 relative">
      <div class="absolute top-0 inset-x-0 z-10 backdrop-blur pointer-events-none">
        <div class="flex items-center justify-between px-3 py-2 pointer-events-auto">
          <UTooltip text="Back">
            <button
              type="button"
              class="flex items-center gap-1.5 text-muted hover:text-highlighted transition-colors cursor-pointer"
              @click="collapseToSidebar"
            >
              <UIcon name="i-lucide-arrow-left" class="size-4" />
              <span class="font-semibold">alexop.dev</span>
            </button>
          </UTooltip>

          <div class="flex items-center gap-1.5">
            <UTooltip v-if="canClear" text="New conversation">
              <UButton
                icon="i-lucide-list-x"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Clear conversation"
                @click="clear"
              />
            </UTooltip>
            <UColorModeButton size="sm" color="neutral" variant="ghost" />
          </div>
        </div>
      </div>

      <template v-if="!messages.length">
        <div class="flex-1 flex flex-col items-center justify-center gap-8 p-8">
          <div class="flex w-full max-w-2xl flex-col items-center px-4">
            <div class="text-center">
              <h1 class="text-2xl sm:text-3xl font-semibold text-highlighted tracking-tight">
                What can I help you with?
              </h1>
              <p class="text-base text-muted mt-2 max-w-lg mx-auto">
                Ask anything about Alex's blog, notes, or TILs.
              </p>
            </div>
          </div>

          <div class="w-full max-w-2xl flex flex-col gap-6">
            <ChatComposer :maxrows="5" />

            <div class="flex flex-col gap-6 mt-2">
              <UPageLinks
                v-for="category in faqQuestions"
                :key="category.category"
                :title="category.category"
                :links="category.items.map(item => ({ label: item, onClick: () => ask(item) }))"
              />
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="flex-1 overflow-y-auto overscroll-none">
          <div class="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <ChatMessages class="pt-12 pb-4" />
          </div>
        </div>

        <div class="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-3">
          <ChatComposer />
        </div>
      </template>
    </div>
  </ClientOnly>
</template>
