import { z } from 'zod'
import { SUPPORTED_LANGUAGES } from '@/shared/constants/languages'

const ProjectTranslationSchema = z.object({
  lang: z.enum(SUPPORTED_LANGUAGES),
  title: z.string().trim().min(1),
  short_description: z.string().trim().nullable().optional(),
  location_name: z.string().trim().nullable().optional(),
})

export const ProjectsCreateSchema = z.object({
  status: z.string().trim().min(1),
  browse_photos_url: z.string().trim().nullable().optional(),
  book_visit_url: z.string().trim().nullable().optional(),
  lat: z.coerce.number().min(-90).max(90).nullable().optional(),
  lng: z.coerce.number().min(-180).max(180).nullable().optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.coerce.number().int().optional(),
  is_active: z.boolean().optional(),
  translations: z
    .array(ProjectTranslationSchema)
    .min(1)
    .refine(
      (translations) => new Set(translations.map((translation) => translation.lang)).size === translations.length,
      { message: 'common.validation.duplicateLanguage' }
    ),
})

export const ProjectsUpdateSchema = ProjectsCreateSchema.partial()

export type ProjectsCreatePayload = z.infer<typeof ProjectsCreateSchema>
export type ProjectsUpdatePayload = z.infer<typeof ProjectsUpdateSchema>

export type ProjectsEntity = {
  id: number
  section_id: number | null
  status: string
  status_label?: string | null
  browse_photos_url: string | null
  book_visit_url: string | null
  lat: number | null
  lng: number | null
  is_featured: boolean
  sort_order: number
  is_active: boolean
  translations: {
    lang: string
    title: string
    short_description: string
    location_name: string
  }[]
  media: {
    id: number
    collection: string
    name: string
    file_name: string
    mime_type: string
    size: number
    url: string
    thumb_url: string
    custom_properties: {
      seeded: boolean
    }
    order_column: number
  }[]
  created_at: string
  updated_at: string
}
