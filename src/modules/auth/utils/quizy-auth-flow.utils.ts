export const DEFAULT_COUNTRY_CALLING_CODE = '+963'
export const QUIZY_STUDENT_ROLE = 2

export function normalizePhoneDigits(value: string): string {
  return value.replace(/[^0-9+]/g, '')
}

export function normalizeCountryCallingCode(value?: string | null): string {
  if (!value) return DEFAULT_COUNTRY_CALLING_CODE
  const digits = String(value).replace(/[^0-9]/g, '')
  return digits ? `+${digits}` : DEFAULT_COUNTRY_CALLING_CODE
}

export function cleanPhoneNumber(phoneNumber: string, countryCallingCode?: string | null): string {
  let clean = normalizePhoneDigits(phoneNumber).replace(/^\+/, '')
  const code = normalizeCountryCallingCode(countryCallingCode).replace(/^\+/, '')

  if (clean.startsWith(code)) {
    clean = clean.slice(code.length)
  }

  return clean
}

export function formatPhoneNumber(phoneNumber?: string | null, countryCallingCode?: string | null): string {
  if (!phoneNumber) return ''
  return `${normalizeCountryCallingCode(countryCallingCode)} ${phoneNumber}`
}
