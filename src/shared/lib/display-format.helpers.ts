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

function toSafeText(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

export function normalizePhoneDigits(value: unknown): string {
  return toSafeText(value).replace(/\D+/g, '')
}

function toPhoneDisplayValue(value: unknown): string {
  const normalizedValue = toSafeText(value)
  const hasLeadingPlus = normalizedValue.startsWith('+')
  const digits = normalizePhoneDigits(normalizedValue)

  if (!digits) {
    return ''
  }

  return hasLeadingPlus ? `+${digits}` : digits
}

export function looksLikePhoneText(value: unknown): boolean {
  const normalizedValue = toSafeText(value)

  if (!normalizedValue || !PHONE_TEXT_PATTERN.test(normalizedValue)) {
    return false
  }

  return normalizePhoneDigits(normalizedValue).length >= 7
}

export function stripDisplayIdTokens(value: unknown): string {
  let formattedValue = toSafeText(value)

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
  const normalizedValue = toSafeText(value)

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
