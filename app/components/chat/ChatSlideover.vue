<script setup lang="ts">
const store = useAgentChatStore()
const {
  isOpen: open,
  mode,
  useContext,
  currentPage,
  messages,
  canClear
} = storeToRefs(store)
const {
  ask,
  clear,
  switchMode,
  toggleContext,
  expandToFullScreen,
  faqQuestions
} = store

const showDetails = ref(false)

const modeItems = [
  { label: 'Classical', value: 'classical' as const },
  { label: 'Code Mode', value: 'code' as const }
]

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
      <UTooltip text="Toggle agent details">
        <UButton
          icon="i-lucide-sliders-horizontal"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Toggle agent details"
          :class="showDetails ? 'text-primary' : ''"
          @click="showDetails = !showDetails"
        />
      </UTooltip>
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
          <div v-if="showDetails" class="px-4 py-3 border-b border-default flex flex-col gap-2 bg-elevated/30">
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs font-medium text-muted">Agent mode</span>
              <UTabs
                :model-value="mode"
                :items="modeItems"
                :content="false"
                size="xs"
                variant="pill"
                @update:model-value="(v) => switchMode(v as typeof mode)"
              />
            </div>
            <p class="text-[11px] text-muted leading-snug">
              <template v-if="mode === 'classical'">
                One MCP tool call per step — classical fan-out.
              </template>
              <template v-else>
                LLM writes JS that orchestrates tools in a V8 sandbox — one round-trip.
              </template>
            </p>
            <ChatMetricsCompare />
          </div>
        </Transition>

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
          <ChatEmptyState
            v-if="!messages.length"
            :faq-questions="faqQuestions"
            @ask="ask"
          />

          <div v-else class="px-4 sm:px-4">
            <ChatMessages compact class="pt-4 pb-4" />
          </div>
        </div>

        <div class="border-t border-default">
          <ChatComposer />
        </div>
      </div>
    </template>
  </USlideover>
</template>
