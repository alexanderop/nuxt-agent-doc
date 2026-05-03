<script setup lang="ts">
import { getToolName } from 'ai'
import { isToolStreaming } from '@nuxt/ui/utils/ai'
import { rendererFor, type ToolPart } from './tool-renderers'

const { part } = defineProps<{ part: ToolPart }>()

const renderer = computed(() => rendererFor(getToolName(part)))
const streaming = computed(() => isToolStreaming(part))
const text = computed(() => streaming.value ? renderer.value.streamingText : renderer.value.doneText)
const showResult = computed(() => Boolean(renderer.value.Result) && part.state === 'output-available')
</script>

<template>
  <UChatTool
    :icon="renderer.icon"
    :streaming="streaming"
    :text="text"
  />
  <component
    :is="renderer.Result"
    v-if="showResult"
    :part="part"
  />
</template>
