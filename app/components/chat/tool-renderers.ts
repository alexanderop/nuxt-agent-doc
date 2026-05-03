import type { Component } from 'vue'
import type { UIMessage } from 'ai'
import ChatResultShowPost from './ChatResultShowPost.vue'

export type ToolPart = Extract<UIMessage['parts'][number], { type: `tool-${string}` } | { type: 'dynamic-tool' }>

type ChipRenderer = {
  icon: string
  streamingText: string
  doneText: string
  Result?: Component
}

const TOOL_RENDERERS: Record<string, ChipRenderer> = {
  show_post: { icon: 'i-lucide-file-text', streamingText: 'Finding post…', doneText: 'Found post', Result: ChatResultShowPost },
  list_blog_posts: { icon: 'i-lucide-newspaper', streamingText: 'Searching blog posts…', doneText: 'Searched blog posts' },
  get_blog_post: { icon: 'i-lucide-book-open', streamingText: 'Reading blog post…', doneText: 'Read blog post' },
  list_notes: { icon: 'i-lucide-sticky-note', streamingText: 'Searching notes…', doneText: 'Searched notes' },
  get_note: { icon: 'i-lucide-sticky-note', streamingText: 'Reading note…', doneText: 'Read note' },
  list_tils: { icon: 'i-lucide-lightbulb', streamingText: 'Searching TILs…', doneText: 'Searched TILs' },
  get_til: { icon: 'i-lucide-lightbulb', streamingText: 'Reading TIL…', doneText: 'Read TIL' }
}

const GENERIC_RENDERER: ChipRenderer = {
  icon: 'i-lucide-wrench',
  streamingText: 'Running…',
  doneText: 'Done'
}

export function rendererFor(name: string): ChipRenderer {
  return TOOL_RENDERERS[name] ?? GENERIC_RENDERER
}
