import { z } from 'zod'

export const FaqsCreateSchema = z.object({
  section_id: z.coerce.number(),
  sort_order: z.coerce.number(),
  is_active: z.boolean(),
  translations: z.array(z.object({
  lang: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
})),
})

export const FaqsUpdateSchema = FaqsCreateSchema.partial()

export type FaqsCreatePayload = z.infer<typeof FaqsCreateSchema>
export type FaqsUpdatePayload = z.infer<typeof FaqsUpdateSchema>

export type FaqsEntity = {
  id: number
  section_id: number
  sort_order: number
  is_active: boolean
  translations: {
    lang: string
    question: string
    answer: string
  }[]
  created_at: string
  updated_at: string
}
