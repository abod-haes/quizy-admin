import type { FaqsCreatePayload } from '@/modules/faqs/types/faqs.type'
import { FaqsCreateSchema } from '@/modules/faqs/types/faqs.type'
import {
  hasFormErrors,
  type FormErrors,
  validateWithSchema,
} from '@/shared/lib/forms/zod-form-errors'

export { FaqsCreateSchema }

export type FaqsFormErrors = FormErrors

export function validateFaqsPayload(payload: FaqsCreatePayload): FaqsFormErrors {
  return validateWithSchema(FaqsCreateSchema, payload)
}

export const hasFaqsValidationErrors = hasFormErrors
