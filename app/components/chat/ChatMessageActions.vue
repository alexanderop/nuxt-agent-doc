<script setup lang="ts">
import type { UIMessage } from 'ai'
import { getTextFromMessage } from '@nuxt/ui/utils/ai'

const { message } = defineProps<{ message: UIMessage }>()

const { copy, copied } = useClipboard()

const textContent = computed(() => getTextFromMessage(message).trim())
</script>

<template>
  <div v-if="textContent" class="flex items-center gap-0.5">
    <UTooltip :text="copied ? 'Copied' : 'Copy'">
      <UButton
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :aria-label="copied ? 'Copied' : 'Copy response'"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="copy(textContent)"
      />
    </UTooltip>
  </div>
</template>
