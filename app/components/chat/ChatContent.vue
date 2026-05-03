<script setup lang="ts">
import type { UIMessage } from 'ai'
import { isTextUIPart, isToolUIPart, isReasoningUIPart, getToolName } from 'ai'
import { isPartStreaming } from '@nuxt/ui/utils/ai'
import type { ToolPart } from './tool-renderers'

const { message } = defineProps<{ message: UIMessage }>()

function codeInputLength(part: ToolPart): number {
  if (!('input' in part) || typeof part.input !== 'object' || part.input === null) return 0
  if (!('code' in part.input)) return 0
  const code: unknown = part.input.code
  return typeof code === 'string' ? code.length : 0
}

function codeBlockKey(part: ToolPart, index: number): string {
  return `${message.id}-${index}-${part.state}-${codeInputLength(part)}`
}
</script>

<template>
  <template v-for="(part, i) in message.parts" :key="`${message.id}-${i}`">
    <UChatReasoning
      v-if="isReasoningUIPart(part)"
      :text="part.text"
      :streaming="isPartStreaming(part)"
      icon="i-lucide-brain"
    >
      <ChatComark :markdown="part.text" :streaming="isPartStreaming(part)" />
    </UChatReasoning>

    <template v-else-if="isTextUIPart(part) && part.text.length > 0">
      <ChatComark
        v-if="message.role === 'assistant'"
        :markdown="part.text"
        :streaming="isPartStreaming(part)"
      />
      <p v-else class="whitespace-pre-wrap text-sm/6">
        {{ part.text }}
      </p>
    </template>

    <ChatCodeBlock
      v-else-if="isToolUIPart(part) && getToolName(part) === 'code'"
      :key="codeBlockKey(part, i)"
      :part="part"
      :message="message"
    />

    <ChatToolRender
      v-else-if="isToolUIPart(part)"
      :part="part"
    />
  </template>
</template>
