<script setup lang="ts">
import type { UIMessage } from 'ai'
import { isTextUIPart, isToolUIPart, getToolName } from 'ai'
import { isToolStreaming } from '@nuxt/ui/utils/ai'
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
</script>

<template>
  <template v-for="(part, i) in message.parts" :key="`${message.id}-${i}`">
    <p
      v-if="isTextUIPart(part) && part.text.length > 0"
      class="whitespace-pre-wrap text-sm/6"
    >
      {{ part.text }}
    </p>
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
      :part="part"
    />
    <UChatTool
      v-else-if="isToolUIPart(part)"
      :icon="getToolName(part).startsWith('list_') ? 'i-lucide-list' : 'i-lucide-file-text'"
      :streaming="isToolStreaming(part)"
      :text="getToolName(part)"
    />
  </template>
</template>
