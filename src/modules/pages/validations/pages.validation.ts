import type { PagesCreatePayload } from '@/modules/pages/types/pages.type'
import { PagesCreateSchema } from '@/modules/pages/types/pages.type'
import {
  hasFormErrors,
  type FormErrors,
  validateWithSchema,
} from '@/shared/lib/forms/zod-form-errors'

export { PagesCreateSchema }

export type PagesFormErrors = FormErrors

export function validatePagesPayload(payload: PagesCreatePayload): PagesFormErrors {
  return validateWithSchema(PagesCreateSchema, payload)
}

export const hasPagesValidationErrors = hasFormErrors
