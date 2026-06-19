import axios from 'axios'

export type ApiValidationErrors = Record<string, string[]>

export type ApiError = {
  message: string
  status: number | null
  errors?: ApiValidationErrors
}

function normalizeValidationErrors(input: unknown): ApiValidationErrors | undefined {
  if (!input || typeof input !== 'object') {
    return undefined
  }

  const result: ApiValidationErrors = {}

  for (const [field, rawMessages] of Object.entries(input as Record<string, unknown>)) {
    if (Array.isArray(rawMessages)) {
      const messages = rawMessages
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)

      if (messages.length) {
        result[field] = messages
      }
      continue
    }

    if (typeof rawMessages === 'string') {
      const normalizedMessage = rawMessages.trim()
      if (normalizedMessage) {
        result[field] = [normalizedMessage]
      }
    }
  }

  return Object.keys(result).length ? result : undefined
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { message?: unknown; errors?: unknown } | undefined
    const message =
      typeof responseData?.message === 'string' && responseData.message.trim()
        ? responseData.message
        : error.message

    return {
      message,
      status: error.response?.status ?? null,
      errors: normalizeValidationErrors(responseData?.errors),
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      status: null,
    }
  }

  return {
    message: 'Unexpected error occurred',
    status: null,
  }
}
