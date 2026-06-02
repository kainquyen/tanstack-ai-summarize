import z from 'zod'

export const importSchema = z.object({
  url: z.url(),
})
export const bulkImportSchema = z.object({
  url: z.url(),
  search: z.string(),
})

export const customImportMetaDataSchema = z.object({
  publishedAt: z.string().nullable(),
  author: z.string().nullable()
})

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query must be at least 1 character long'),
})