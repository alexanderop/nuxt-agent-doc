<script setup lang="ts">
const store = useAgentChatStore()
const {
  isOpen: open,
  viewMode,
  useContext,
  currentPage,
  hasAnyMessages,
  canClear
} = storeToRefs(store)
const {
  ask,
  clear,
  toggleContext,
  expandToFullScreen,
  send,
  faqQuestions
} = store

const slideTransition = {
  'enter-active-class': 'transition-all duration-150',
  'leave-active-class': 'transition-all duration-150',
  'enter-from-class': 'opacity-0 -translate-y-1',
  'leave-to-class': 'opacity-0 -translate-y-1'
}

defineShortcuts({
  tab: {
    handler: () => {
      if (currentPage.value) toggleContext()
    }
  }
})

// In Both mode, the slideover never renders the split view — auto-expand to /chat instead.
async function handleSlideoverSend(): Promise<void> {
  if (viewMode.value === 'both') {
    await expandToFullScreen()
  }
  await send()
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :ui="{
      content: 'sm:max-w-md',
      header: 'min-h-(--ui-header-height) flex items-center gap-1.5 overflow-hidden border-b border-default px-4',
      title: 'text-highlighted font-semibold truncate',
      body: 'p-0'
    }"
  >
    <template #title>
      <span class="inline-flex items-center gap-2 min-w-0">
        <span class="truncate">Agent</span>
        <UBadge variant="subtle" size="sm" class="shrink-0">
          Beta
        </UBadge>
      </span>
    </template>

    <template #actions>
      <UTooltip v-if="canClear" text="Clear chat">
        <UButton
          icon="i-lucide-list-x"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Clear conversation"
          @click="clear"
        />
      </UTooltip>
      <UTooltip text="Open full screen">
        <UButton
          icon="i-lucide-maximize-2"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Open full screen"
          @click="expandToFullScreen"
        />
      </UTooltip>
    </template>

    <template #close>
      <UTooltip text="Close">
        <UButton
          icon="i-lucide-panel-right-close"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Close"
          @click="open = false"
        />
      </UTooltip>
    </template>

    <template #body>
      <div class="flex flex-col h-full">
        <Transition v-bind="slideTransition">
          <div
            v-if="currentPage && useContext"
            class="px-4 py-2 border-b border-default flex items-center gap-2"
          >
            <UIcon name="i-lucide-link" class="size-3.5 text-muted shrink-0" />
            <span class="text-xs text-muted truncate flex-1">
              Using context: <span class="text-dimmed">alexop.dev</span><span class="text-default">{{ currentPage }}</span>
            </span>
            <UKbd value="Tab" size="sm" />
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Stop using page context"
              @click="toggleContext"
            />
          </div>
        </Transition>

        <div class="flex-1 overflow-y-auto overscroll-none">
          <template v-if="!hasAnyMessages">
            <div class="px-4 py-3 border-b border-default flex justify-center">
              <ChatModePicker size="compact-slideover" />
            </div>
            <ChatEmptyState
              :faq-questions="faqQuestions"
              @ask="ask"
            />
          </template>

          <div v-else class="px-4 sm:px-4">
            <ChatMessages compact class="pt-4 pb-4" />
          </div>
        </div>

        <div class="border-t border-default">
          <ChatComposer :on-submit="handleSlideoverSend" />
        </div>
      </div>
    </template>
  </USlideover>
</template>
