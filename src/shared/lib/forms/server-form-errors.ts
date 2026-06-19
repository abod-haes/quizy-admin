import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import type { ApiValidationErrors } from '@/core/api/api-error.type'

type ServerFormErrorShape = {
  message?: string
  errors?: ApiValidationErrors
}

type ApplyServerFieldErrorsOptions<TFieldValues extends FieldValues> = {
  error: unknown
  setError: UseFormSetError<TFieldValues>
  allowedFields: readonly string[]
  fieldAliases?: Record<string, string>
}

function getServerErrorShape(error: unknown): ServerFormErrorShape | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  return error as ServerFormErrorShape
}

function toFirstMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' && item.trim()) {
        return item.trim()
      }
    }
  }

  return null
}

function toNormalizedPath(path: string): string {
  return path.trim().replace(/\[(\d+)\]/g, '.$1')
}

function toCamelCasePath(path: string): string {
  return path
    .split('.')
    .map((segment) => segment.replace(/[_-]+([a-zA-Z0-9])/g, (_, char: string) => char.toUpperCase()))
    .join('.')
}

function toCandidatePaths(path: string): string[] {
  const normalizedPath = toNormalizedPath(path)
  const camelPath = toCamelCasePath(normalizedPath)

  if (camelPath === normalizedPath) {
    return [normalizedPath]
  }

  return [normalizedPath, camelPath]
}

export function getServerFormErrorMessage(error: unknown): string | null {
  const shape = getServerErrorShape(error)

  if (!shape) {
    return null
  }

  return toFirstMessage(shape.message)
}

export function applyServerFieldErrors<TFieldValues extends FieldValues>({
  error,
  setError,
  allowedFields,
  fieldAliases,
}: ApplyServerFieldErrorsOptions<TFieldValues>): boolean {
  const shape = getServerErrorShape(error)
  const validationErrors = shape?.errors

  if (!validationErrors || typeof validationErrors !== 'object') {
    return false
  }

  const allowedFieldSet = new Set(allowedFields)
  let hasAnyFieldError = false

  for (const [rawFieldName, rawMessages] of Object.entries(validationErrors)) {
    const message = toFirstMessage(rawMessages)
    if (!message) {
      continue
    }

    const normalizedFieldName = toNormalizedPath(rawFieldName)
    const aliasField = fieldAliases?.[normalizedFieldName]

    const candidates = aliasField
      ? [aliasField]
      : toCandidatePaths(normalizedFieldName)

    const matchedField = candidates.find((candidate) => allowedFieldSet.has(candidate))

    if (!matchedField) {
      continue
    }

    setError(matchedField as Path<TFieldValues>, {
      type: 'server',
      message,
    })
    hasAnyFieldError = true
  }

  return hasAnyFieldError
}
