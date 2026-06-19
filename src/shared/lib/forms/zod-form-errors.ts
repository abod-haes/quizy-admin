import type { ZodIssue, ZodType } from 'zod'

export type FormErrors = Record<string, string>

function isRequiredLikeIssue(issue: ZodIssue): boolean {
  if (issue.message === 'Required') {
    return true
  }

  if (issue.code !== 'too_small') {
    if (issue.code === 'invalid_type' || issue.code === 'invalid_value') {
      const issueWithInput = issue as ZodIssue & { input?: unknown }
      return issueWithInput.input == null || issueWithInput.input === ''
    }
    return false
  }

  const issueWithMinimum = issue as ZodIssue & { minimum?: number }
  return issueWithMinimum.minimum === 1
}

function getIssueTranslationKey(issue: ZodIssue): string {
  if (isRequiredLikeIssue(issue)) {
    return 'common.validation.required'
  }

  switch (issue.code) {
    case 'invalid_type':
      return 'common.validation.invalidType'
    case 'invalid_value':
      return 'common.validation.invalidValue'
    case 'too_small':
      return 'common.validation.tooSmall'
    case 'too_big':
      return 'common.validation.tooBig'
    case 'invalid_format':
      return 'common.validation.invalidFormat'
    case 'not_multiple_of':
      return 'common.validation.invalidNumber'
    case 'custom':
      return 'common.validation.invalidFile'
    default:
      return 'common.validation.invalid'
  }
}

export function toZodFormErrors(issues: readonly ZodIssue[]): FormErrors {
  const errors: FormErrors = {}

  for (const issue of issues) {
    const path = issue.path.join('.') || 'form'

    if (!errors[path]) {
      errors[path] = getIssueTranslationKey(issue)
    }
  }

  return errors
}

export function validateWithSchema<TOutput>(
  schema: ZodType<TOutput>,
  payload: unknown
): FormErrors {
  const parsed = schema.safeParse(payload)
  return parsed.success ? {} : toZodFormErrors(parsed.error.issues)
}

export function hasFormErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0
}

export function translateFormError(
  error: string | undefined,
  translate: (key: string, options?: Record<string, unknown>) => string
): string | undefined {
  if (!error) {
    return undefined
  }

  if (!error.startsWith('common.validation.')) {
    return error
  }

  return translate(error, { ns: 'translation' })
}
