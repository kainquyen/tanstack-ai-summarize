import { prisma } from '#/db'
import { firecrawl } from '#/lib/firecrawl'
import { createServerFn } from '@tanstack/react-start'
import { getSessionFn } from './session'
import type z from 'zod'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { customImportMetaDataSchema, importSchema } from '#/schemas/import'

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
