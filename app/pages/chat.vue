<script setup lang="ts">
definePageMeta({
  layout: 'chat'
})

useHead({
  title: 'Ask my blog · Agent'
})

const store = useAgentChatStore()
const {
  viewMode,
  hasAnyMessages,
  canClear
} = storeToRefs(store)
const {
  ask,
  clear,
  collapseToSidebar,
  faqQuestions
} = store

const modeDescriptions: Record<typeof viewMode.value, string> = {
  classical: 'One MCP tool call per LLM step. Classical fan-out.',
  code: 'LLM writes JS that batches tool calls in a V8 sandbox.',
  both: 'Same blog. Two agent architectures. Run both side-by-side.'
}

const overflowItems = computed(() => {
  const items: { label: string, icon: string, onSelect: () => void }[] = []
  if (canClear.value) {
    items.push({
      label: 'New conversation',
      icon: 'i-lucide-list-x',
      onSelect: () => clear()
    })
  }
  return [items]
})
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

          <div class="flex items-center gap-2">
            <ChatModePicker v-if="hasAnyMessages" size="compact-header" />
            <UDropdownMenu v-if="hasAnyMessages && (overflowItems[0]?.length ?? 0) > 0" :items="overflowItems">
              <UButton
                icon="i-lucide-more-horizontal"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="More actions"
              />
            </UDropdownMenu>
            <UColorModeButton size="sm" color="neutral" variant="ghost" />
          </div>
        </div>
      </div>

      <template v-if="!hasAnyMessages">
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

          <div class="w-full max-w-2xl flex flex-col items-center gap-3">
            <ChatModePicker size="hero" />
            <p class="text-sm text-muted text-center">
              {{ modeDescriptions[viewMode] }}
            </p>
            <ChatModeMetricsStrip />
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

      <template v-else-if="viewMode === 'both'">
        <div class="flex-1 min-h-0 px-3 sm:px-4 pt-12 pb-3">
          <ChatSplitView />
        </div>

        <div class="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-3">
          <ChatComposer />
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
