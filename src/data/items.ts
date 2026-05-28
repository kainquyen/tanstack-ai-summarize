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
} from '#/schemas/import'
import { authMiddleware } from '#/middlewares/auth'

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
      // console.log(error)
      const failed = await prisma.savedItem.update({
        where: {
          id: item.id,
        },
        data: {
          status: 'FAILED',
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

export const scrapeUrlsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      urls: z.array(z.string().url()),
    }),
  )
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < data.urls.length; i++) {
      const url = data.urls[i]

      const item = await prisma.savedItem.create({
        data: {
          url: url,
          userId: context.session?.user.id,
          status: 'PROCESSING',
        },
      })

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
        await prisma.savedItem.update({
          where: {
            id: item.id,
          },
          data: {
            status: 'FAILED',
          },
        })
      }
    }
  })

export const getItemsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({context}) => {
    const items = await prisma.savedItem.findMany({
      where: {
        userId: context.session?.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return items
  })
