import { tool } from 'ai'
import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export type ShowPostSuccess = {
  title: string
  slug: string
  description: string
  tags: string[]
  pubDatetime: string
}
export type ShowPostOutput = ShowPostSuccess | { error: string }

export const showPostTool = tool({
  description:
    'Render a clickable card for a single blog post. Use this AFTER you have confirmed the post exists (via list_blog_posts or get_blog_post). Pass a real slug — never invent one.',
  inputSchema: z.object({
    slug: z.string().describe('The post slug, e.g. /blog/7-agent-team-patterns-for-claude-code')
  }),
  execute: async ({ slug }): Promise<ShowPostOutput> => {
    const event = useEvent()
    const path = normalizeContentSlug(slug, 'blog')
    const post = await queryCollection(event, 'blog')
      .where('path', '=', path)
      .where('draft', '=', false)
      .first()
    if (!post) {
      return { error: `No published blog post at ${path}` }
    }
    return {
      title: post.title,
      slug: post.path,
      description: post.description,
      tags: post.tags ?? [],
      pubDatetime: post.pubDatetime
    }
  }
})
