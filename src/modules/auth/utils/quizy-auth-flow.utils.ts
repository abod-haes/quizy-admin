export const DEFAULT_COUNTRY_CALLING_CODE = '+963'
export const QUIZY_STUDENT_ROLE = 2

export function normalizePhoneDigits(value: string): string {
  return value.replace(/[^0-9+]/g, '')
}

export function trimCountryCode(phoneNumber: string, countryCallingCode?: string | null): string {
  let value = normalizePhoneDigits(phoneNumber).replace(/^\+/, '')
  const code = String(countryCallingCode || DEFAULT_COUNTRY_CALLING_CODE).replace(/[^0-9]/g, '')

  if (code && value.startsWith(code)) {
    value = value.slice(code.length)
  }

  return value
}
