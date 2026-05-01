<script setup lang="ts">
import type { UIMessage } from 'ai'
import { isTextUIPart, isToolUIPart, getToolName } from 'ai'
import { isToolStreaming } from '@nuxt/ui/utils/ai'

defineProps<{ message: UIMessage }>()
</script>

<template>
  <template v-for="(part, i) in message.parts" :key="`${message.id}-${i}`">
    <p
      v-if="isTextUIPart(part) && part.text.length > 0"
      class="whitespace-pre-wrap text-sm/6"
    >
      {{ part.text }}
    </p>
    <UChatTool
      v-else-if="isToolUIPart(part)"
      :icon="getToolName(part).startsWith('list_') ? 'i-lucide-list' : 'i-lucide-file-text'"
      :streaming="isToolStreaming(part)"
      :text="getToolName(part)"
    />
  </template>
</template>
