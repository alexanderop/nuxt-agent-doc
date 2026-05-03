import type { z } from 'zod'
import type { CodeFns, ToolFn } from '../code-runtime'
import { listBlogPostsHandler, listBlogPostsSchema } from './list-blog-posts'
import { getBlogPostHandler, getBlogPostSchema } from './get-blog-post'
import { listNotesHandler, listNotesSchema } from './list-notes'
import { getNoteHandler, getNoteSchema } from './get-note'
import { listTilsHandler, listTilsSchema } from './list-tils'
import { getTilHandler, getTilSchema } from './get-til'

const wrap = <S extends z.ZodTypeAny>(schema: S, handler: (input: z.infer<S>) => unknown): ToolFn =>
  async (input: unknown) => handler(schema.parse(input))

export const contentToolFns: CodeFns = Object.freeze({
  list_blog_posts: wrap(listBlogPostsSchema, listBlogPostsHandler),
  get_blog_post: wrap(getBlogPostSchema, getBlogPostHandler),
  list_notes: wrap(listNotesSchema, listNotesHandler),
  get_note: wrap(getNoteSchema, getNoteHandler),
  list_tils: wrap(listTilsSchema, listTilsHandler),
  get_til: wrap(getTilSchema, getTilHandler)
})
