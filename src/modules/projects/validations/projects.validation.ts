import type { ProjectsCreatePayload } from '@/modules/projects/types/projects.type'
import { ProjectsCreateSchema } from '@/modules/projects/types/projects.type'
import {
  hasFormErrors,
  type FormErrors,
  validateWithSchema,
} from '@/shared/lib/forms/zod-form-errors'

export { ProjectsCreateSchema }

export type ProjectsFormErrors = FormErrors

export function validateProjectsPayload(payload: ProjectsCreatePayload): ProjectsFormErrors {
  return validateWithSchema(ProjectsCreateSchema, payload)
}

export const hasProjectsValidationErrors = hasFormErrors
