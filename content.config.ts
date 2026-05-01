import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        author: z.string().default('Alexander Opalic'),
        pubDatetime: z.coerce.date(),
        modDatetime: z.coerce.date().optional(),
        tags: z.array(z.string()).default([]),
        draft: z.boolean().default(false),
        ogImage: z.string().optional(),
        seriesTag: z.string().optional(),
        seriesTitle: z.string().optional()
      })
    }),
    notes: defineCollection({
      type: 'page',
      source: 'notes/**/*.md',
      schema: z.object({
        title: z.string(),
        author: z.string().default('Alexander Opalic'),
        pubDatetime: z.coerce.date(),
        sourceType: z.enum(['book', 'video', 'article', 'podcast', 'other']),
        sourceAuthor: z.string(),
        sourceUrl: z.string().url().optional(),
        cover: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        tags: z.array(z.string()).default([]),
        description: z.string(),
        draft: z.boolean().default(false),
        highlights: z
          .array(
            z.object({
              quote: z.string(),
              comment: z.string().optional(),
              timestamp: z.string().optional(),
              page: z.number().optional()
            })
          )
          .optional()
      })
    }),
    til: defineCollection({
      type: 'page',
      source: 'til/**/*.md',
      schema: z.object({
        title: z.string(),
        author: z.string().default('Alexander Opalic'),
        pubDatetime: z.coerce.date(),
        tags: z.array(z.string()).default([]),
        description: z.string().optional(),
        draft: z.boolean().default(false)
      })
    })
  }
})
