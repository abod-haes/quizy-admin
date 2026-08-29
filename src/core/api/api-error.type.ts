import axios from 'axios'

export type ApiValidationErrors = Record<string, string[]>

export type ApiError = {
  message: string
  status: number | null
  code?: string
  path?: string
  errors?: ApiValidationErrors
  retryAfterSeconds?: number
}

type ApiErrorPayload = {
  message?: unknown
  status?: unknown
  statusCode?: unknown
  code?: unknown
  path?: unknown
  errors?: unknown
  retryAfterSeconds?: unknown
}

const FALLBACK_ERROR_MESSAGE = 'تعذر إكمال العملية. حاول مرة أخرى.'

function normalizeMessage(input: unknown): string | undefined {
  if (typeof input === 'string') {
    const message = input.trim()
    return message || undefined
  }

  if (Array.isArray(input)) {
    const messages = input
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean)

    return messages.length ? Array.from(new Set(messages)).join(' • ') : undefined
  }

  return undefined
}

function normalizeValidationErrors(input: unknown): ApiValidationErrors | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return undefined
  }

  const result: ApiValidationErrors = {}

  for (const [field, rawMessages] of Object.entries(input as Record<string, unknown>)) {
    const messages = Array.isArray(rawMessages)
      ? rawMessages
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean)
      : typeof rawMessages === 'string' && rawMessages.trim()
        ? [rawMessages.trim()]
        : []

    if (messages.length) {
      result[field] = Array.from(new Set(messages))
    }
  }

  return Object.keys(result).length ? result : undefined
}

function normalizeStatus(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeRetryAfter(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function fromPayload(payload: ApiErrorPayload, fallbackMessage?: string): ApiError {
  const messageArray = Array.isArray(payload.message) ? payload.message : undefined
  const errors =
    normalizeValidationErrors(payload.errors) ??
    (messageArray?.length
      ? {
          _form: messageArray
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean),
        }
      : undefined)

  return {
    message: normalizeMessage(payload.message) ?? fallbackMessage ?? FALLBACK_ERROR_MESSAGE,
    status: normalizeStatus(payload.statusCode) ?? normalizeStatus(payload.status),
    code: normalizeOptionalString(payload.code),
    path: normalizeOptionalString(payload.path),
    errors: errors && Object.values(errors).some((messages) => messages.length) ? errors : undefined,
    retryAfterSeconds: normalizeRetryAfter(payload.retryAfterSeconds),
  }
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const payload = value as Record<string, unknown>
  return (
    'message' in payload ||
    'status' in payload ||
    'statusCode' in payload ||
    'code' in payload ||
    'errors' in payload
  )
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const responseData = isApiErrorPayload(error.response?.data)
      ? error.response?.data
      : undefined

    if (responseData) {
      const normalized = fromPayload(responseData, error.message)
      return {
        ...normalized,
        status: normalized.status ?? error.response?.status ?? null,
      }
    }

    return {
      message: normalizeMessage(error.message) ?? FALLBACK_ERROR_MESSAGE,
      status: error.response?.status ?? null,
    }
  }

  // Axios responses are normalized once by the HTTP interceptor. React Query then
  // receives this plain object, so keep normalization idempotent instead of replacing
  // a useful server message with a generic fallback.
  if (isApiErrorPayload(error)) {
    return fromPayload(error)
  }

  if (error instanceof Error) {
    return {
      message: normalizeMessage(error.message) ?? FALLBACK_ERROR_MESSAGE,
      status: null,
    }
  }

  return {
    message: FALLBACK_ERROR_MESSAGE,
    status: null,
  }
}

export function getApiErrorMessage(error: unknown): string {
  const normalized = toApiError(error)
  const validationMessages = normalized.errors
    ? Array.from(new Set(Object.values(normalized.errors).flat().filter(Boolean)))
    : []

  if (validationMessages.length) {
    const visibleMessages = validationMessages.slice(0, 3)
    const remaining = validationMessages.length - visibleMessages.length
    return `${visibleMessages.join(' • ')}${remaining > 0 ? ` (+${remaining})` : ''}`
  }

  return normalized.message || FALLBACK_ERROR_MESSAGE
}
