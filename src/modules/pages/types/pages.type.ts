import { z } from 'zod'

export const PagesCreateSchema = z.object({
  slug: z.string().min(1),
  is_published: z.boolean(),
  translations: z.array(z.object({
  lang: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
})),
})

export const PagesUpdateSchema = PagesCreateSchema.partial()

export type PagesCreatePayload = z.infer<typeof PagesCreateSchema>
export type PagesUpdatePayload = z.infer<typeof PagesUpdateSchema>

export type PagesEntity = {
  id: number
  slug: string
  is_published: boolean
  created_by: null
  updated_by: null
  translations: {
    lang: string
    title: string
    description: string
  }[]
  created_at: string
  updated_at: string
}
