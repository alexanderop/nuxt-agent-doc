import { Feed } from 'feed'
import { queryCollection } from '@nuxt/content/server'

const SITE_URL = 'https://alexop.dev'

export default defineEventHandler(async (event) => {
  const posts = await queryCollection(event, 'blog')
    .where('draft', '=', false)
    .order('pubDatetime', 'DESC')
    .limit(20)
    .all()

  const feed = new Feed({
    id: `${SITE_URL}/`,
    link: `${SITE_URL}/`,
    title: 'alexop.dev',
    description: 'Vue, Nuxt, and AI by Alexander Opalic',
    copyright: `© ${new Date().getFullYear()} Alexander Opalic`,
    updated: posts[0]?.pubDatetime ? new Date(posts[0].pubDatetime) : new Date()
  })

  for (const p of posts) {
    feed.addItem({
      id: `${SITE_URL}${p.path}`,
      title: p.title,
      link: `${SITE_URL}${p.path}`,
      description: p.description,
      date: new Date(p.pubDatetime)
    })
  }

  setHeader(event, 'content-type', 'application/rss+xml')
  return feed.rss2()
})
