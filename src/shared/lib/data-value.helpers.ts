import { getNumberValue as parseNumberValue } from '@/shared/lib/forms/form-value.helpers'

export function getNumberValue(value: unknown): number | null {
  return parseNumberValue(value)
}

export function getStringValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()
  return normalizedValue.length > 0 ? normalizedValue : null
}

export function toIdString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim()
    return normalizedValue.length > 0 ? normalizedValue : null
  }

  return null
}

export function toPositiveInteger(value: unknown): number | null {
  const parsedValue = getNumberValue(value)

  if (parsedValue === null) {
    return null
  }

  const normalizedValue = Math.trunc(parsedValue)
  return normalizedValue > 0 ? normalizedValue : null
}

export function getBooleanValue(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value === 1) {
      return true
    }

    if (value === 0) {
      return false
    }
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase()

    if (normalizedValue === '1' || normalizedValue === 'true') {
      return true
    }

    if (normalizedValue === '0' || normalizedValue === 'false') {
      return false
    }
  }

  return null
}

export function toDateLabel(
  rawValue: unknown,
  options?: { locale?: string; includeTime?: boolean; fallback?: string }
): string {
  const fallback = options?.fallback ?? '-'
  const locale = options?.locale ?? 'en-US'
  const includeTime = options?.includeTime ?? false
  const normalizedValue =
    typeof rawValue === 'string'
      ? rawValue.trim()
      : typeof rawValue === 'number' && Number.isFinite(rawValue)
        ? String(rawValue)
        : ''

  if (!normalizedValue) {
    return fallback
  }

  const parsedDate = new Date(normalizedValue.replace(' ', 'T'))

  if (Number.isNaN(parsedDate.getTime())) {
    return normalizedValue
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  }).format(parsedDate)
}

export function toAmountLabel(value: number | null | undefined, fallback = '-'): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}
