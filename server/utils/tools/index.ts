import { listBlogPostsTool } from './list-blog-posts'
import { getBlogPostTool } from './get-blog-post'
import { listNotesTool } from './list-notes'
import { getNoteTool } from './get-note'
import { listTilsTool } from './list-tils'
import { getTilTool } from './get-til'

export const contentTools = {
  list_blog_posts: listBlogPostsTool,
  get_blog_post: getBlogPostTool,
  list_notes: listNotesTool,
  get_note: getNoteTool,
  list_tils: listTilsTool,
  get_til: getTilTool
}
