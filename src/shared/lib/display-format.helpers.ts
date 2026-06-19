export type UiDisplayFormatOptions = {
  isPhoneNumber?: boolean
  stripIdTokens?: boolean
  fallback?: string
}

const ID_TOKEN_PATTERNS = [
  /\s*\(#\d+\)\s*/g,
  /^\s*#\d+\s*-\s*/g,
  /\s+#\d+\b/g,
]

const PHONE_TEXT_PATTERN = /^[+\d\s()-]+$/

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D+/g, '')
}

function toPhoneDisplayValue(value: string): string {
  const normalizedValue = value.trim()
  const hasLeadingPlus = normalizedValue.startsWith('+')
  const digits = normalizePhoneDigits(normalizedValue)

  if (!digits) {
    return ''
  }

  return hasLeadingPlus ? `+${digits}` : digits
}

export function looksLikePhoneText(value: string): boolean {
  const normalizedValue = value.trim()

  if (!normalizedValue || !PHONE_TEXT_PATTERN.test(normalizedValue)) {
    return false
  }

  return normalizePhoneDigits(normalizedValue).length >= 7
}

export function stripDisplayIdTokens(value: string): string {
  let formattedValue = value

  for (const pattern of ID_TOKEN_PATTERNS) {
    formattedValue = formattedValue.replace(pattern, ' ')
  }

  formattedValue = formattedValue.replace(/\s{2,}/g, ' ').trim()

  if (formattedValue === '-' || formattedValue === '#') {
    return ''
  }

  return formattedValue
}

export function formatUiDisplayValue(
  value: unknown,
  options: UiDisplayFormatOptions = {}
): string {
  const fallback = options.fallback ?? '-'

  if (value === null || value === undefined) {
    return fallback
  }

  const normalizedValue = String(value).trim()

  if (!normalizedValue) {
    return fallback
  }

  let formattedValue = normalizedValue

  if (options.stripIdTokens) {
    formattedValue = stripDisplayIdTokens(formattedValue)
  }

  if (!formattedValue) {
    return fallback
  }

  if (options.isPhoneNumber) {
    const phoneDisplayValue = toPhoneDisplayValue(formattedValue)
    return phoneDisplayValue || fallback
  }

  return formattedValue
}
