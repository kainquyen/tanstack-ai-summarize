import { prisma } from '#/db'
import { firecrawl } from '#/lib/firecrawl'
import { createServerFn } from '@tanstack/react-start'
import { getSessionFn } from './session'
import z from 'zod'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  bulkImportSchema,
  customImportMetaDataSchema,
  importSchema,
  searchSchema,
} from '#/schemas/import'
import { authMiddleware } from '#/middlewares/auth'
import { notFound } from '@tanstack/react-router'
import { generateText } from 'ai'
import { openrouter } from '#/lib/open-router'
import type { SearchResultWeb } from '@mendable/firecrawl-js'

export const scrapeUrlFn = createServerFn({ method: 'POST' })
  .inputValidator(importSchema)
  .handler(async ({ data }) => {
    const session = await getSessionFn()
    if (!session) {
      throw new Error('Unauthorized')
    }
    const item = await prisma.savedItem.create({
      data: {
        url: data.url,
        userId: session.user.id,
        status: 'PROCESSING',
      },
    })

    try {
      const result = await firecrawl.scrape(data.url, {
        formats: [
          'markdown',
          {
            type: 'json',
            // schema: customImportMetaDataSchema, -- If version firecrawl < 4.0 then use schema instead promt
            prompt: 'please extract the author and also publishedAt timestamp',
          },
        ],
        onlyMainContent: true,
        proxy: 'auto',
      })
      const jsonData = result.json as z.infer<typeof customImportMetaDataSchema>

      let publishedAt = null
      if (jsonData.publishedAt) {
        const parsed = new Date(jsonData.publishedAt)

        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed
        }
      }

      const updatedItem = await prisma.savedItem.update({
        where: {
          id: item.id,
        },
        data: {
          title: result.metadata?.title || null,
          content: result.markdown || null,
          ogImage: result.metadata?.ogImage || null,
          publishedAt: publishedAt || null,
          author: jsonData.author || null,
          status: 'COMPLETED',
        },
      })

      return updatedItem
    } catch (error) {

      const failed = await prisma.savedItem.delete({
        where: {
          id: item.id,
        },
      })
      return failed
    }
  })

export const mapUrlFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(bulkImportSchema)
  .handler(async ({ data }) => {
    const res = await firecrawl.map(data.url, {
      limit: 25,
      sitemap: 'include',
      search: data.search,
      location: {
        country: 'US',
        languages: ['vi'],
      },
    })

    return res
  })

export type bulkScrapeProgress = {
  completed: number
  total: number
  url: string
  status: 'success' | 'failed'
}

export const scrapeUrlsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      urls: z.array(z.string().url()),
    }),
  )
  .handler(async function* ({ data, context }) {
    const session = await getSessionFn()
    if (!session) {
      throw new Error('Unauthorized')
    }
    const total = data.urls.length

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < data.urls.length; i++) {
      const url = data.urls[i]

      const item = await prisma.savedItem.create({
        data: {
          url: url,
          userId: session.user.id,
          status: 'PROCESSING',
        },
      })

      let status: bulkScrapeProgress['status'] = 'success'

      try {
        const result = await firecrawl.scrape(url, {
          formats: [
            'markdown',
            {
              type: 'json',
              // schema: customImportMetaDataSchema, -- If version firecrawl < 4.0 then use schema instead promt
              prompt:
                'please extract the author and also publishedAt timestamp',
            },
          ],
          onlyMainContent: true,
          proxy: 'auto',
        })
        const jsonData = result.json as z.infer<
          typeof customImportMetaDataSchema
        >

        let publishedAt = null
        if (jsonData.publishedAt) {
          const parsed = new Date(jsonData.publishedAt)

          if (!isNaN(parsed.getTime())) {
            publishedAt = parsed
          }
        }

        await prisma.savedItem.update({
          where: {
            id: item.id,
          },
          data: {
            title: result.metadata?.title || null,
            content: result.markdown || null,
            ogImage: result.metadata?.ogImage || null,
            publishedAt: publishedAt || null,
            author: jsonData.author || null,
            status: 'COMPLETED',
          },
        })
      } catch (error) {
        // console.log(error)
        status = 'failed'
        await prisma.savedItem.delete({
          where: {
            id: item.id,
          },
        })
      }

      const progress: bulkScrapeProgress = {
        completed: i + 1,
        total: total,
        url: url,
        status: status,
      }
      yield progress
    }
  })

export const getItemsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const items = await prisma.savedItem.findMany({
      where: {
        userId: context.session?.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return items
  })

export const getItemByIdFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const item = await prisma.savedItem.findUnique({
      where: {
        userId: context.session?.user.id,
        id: data.id,
      },
    })

    if (!item) {
      throw notFound()
    }

    return item
  })

export const generateSummaryAndTagsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string(), summary: z.string() }))
  .handler(async ({ data, context }) => {
    const existingItem = await prisma.savedItem.findUnique({
      where: {
        userId: context.session?.user.id,
        id: data.id,
      },
    })

    if (!existingItem) {
      throw notFound()
    }

    const { text } = await generateText({
      model: openrouter.chat('openrouter/owl-alpha'),
      system: `You are a helpful assistant that extracts relevant tags from content summaries.
Extract 3-5 short, relevant tags that categorize the content.
Return ONLY a comma-separated list of tags, nothing else.
Example: technology, programming, web development, javascript`,
      prompt: `Extract tags from this summary: \n\n${data.summary}`,
    })

    const tags = text
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0)
      .slice(0, 5) // Limit to 5 tags

    const updatedItem = await prisma.savedItem.update({
      where: {
        id: data.id,
        userId: context.session?.user.id,
      },
      data: {
        summary: data.summary,
        tags: tags,
      },
    })

    return updatedItem
  })

export const searchWebFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(searchSchema)
  .handler(async ({ data }) => {
    const results = await firecrawl.search(data.query, {
      limit: 15,
      // tbs: 'qdr:y', // Search for results from the past year
    })

    return results.web?.map((result) => ({
      title: (result as SearchResultWeb).title,
      url: (result as SearchResultWeb).url,
      description: (result as SearchResultWeb).description,
    })) as SearchResultWeb[]
  })
