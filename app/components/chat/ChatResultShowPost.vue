<script setup lang="ts">
import type { ShowPostSuccess } from '~~/server/utils/tools/show-post'
import type { ToolPart } from './tool-renderers'

const { part } = defineProps<{ part: ToolPart }>()

function isShowPostSuccess(value: unknown): value is ShowPostSuccess {
  return typeof value === 'object' && value !== null && 'title' in value && 'slug' in value
}

const post = computed<ShowPostSuccess | null>(() => {
  if (part.state !== 'output-available') return null
  return isShowPostSuccess(part.output) ? part.output : null
})
</script>

<template>
  <ToolsPostCard v-if="post" v-bind="post" />
</template>
