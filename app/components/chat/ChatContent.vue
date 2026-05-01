<script setup lang="ts">
import type { UIMessage } from 'ai'
import { isTextUIPart, isToolUIPart, isReasoningUIPart, getToolName } from 'ai'
import { isToolStreaming, isPartStreaming } from '@nuxt/ui/utils/ai'
import type { ShowPostSuccess } from '~~/server/utils/tools/show-post'

const { message } = defineProps<{ message: UIMessage }>()

type ToolPart = Extract<UIMessage['parts'][number], { type: `tool-${string}` } | { type: 'dynamic-tool' }>

function isShowPostSuccess(value: unknown): value is ShowPostSuccess {
  return typeof value === 'object' && value !== null && 'title' in value && 'slug' in value
}

function showPostResult(part: ToolPart): ShowPostSuccess | null {
  if (part.state !== 'output-available') return null
  return isShowPostSuccess(part.output) ? part.output : null
}

function showPostText(part: ToolPart): string {
  if (isToolStreaming(part)) return 'Finding post…'
  return showPostResult(part) ? 'Found post' : 'Post not found'
}

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

    <template v-else-if="isToolUIPart(part) && getToolName(part) === 'show_post'">
      <UChatTool
        icon="i-lucide-file-text"
        :streaming="isToolStreaming(part)"
        :text="showPostText(part)"
      />
      <ToolsPostCard
        v-if="showPostResult(part)"
        v-bind="showPostResult(part)!"
      />
    </template>

    <ChatCodeBlock
      v-else-if="isToolUIPart(part) && getToolName(part) === 'code'"
      :key="codeBlockKey(part, i)"
      :part="part"
    />

    <ChatToolGeneric
      v-else-if="isToolUIPart(part)"
      :part="part"
    />
  </template>
</template>
