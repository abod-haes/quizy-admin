export const DEFAULT_COUNTRY_CALLING_CODE = '+963'
export const QUIZY_STUDENT_ROLE = 2

export type CountryCallingCodeOption = {
  code: string
  label: string
  flag: string
}

export const COUNTRY_CALLING_CODE_OPTIONS: CountryCallingCodeOption[] = [
  { code: '+963', label: 'سوريا', flag: '🇸🇾' },
  { code: '+961', label: 'لبنان', flag: '🇱🇧' },
  { code: '+962', label: 'الأردن', flag: '🇯🇴' },
  { code: '+964', label: 'العراق', flag: '🇮🇶' },
  { code: '+970', label: 'فلسطين', flag: '🇵🇸' },
  { code: '+966', label: 'السعودية', flag: '🇸🇦' },
  { code: '+971', label: 'الإمارات', flag: '🇦🇪' },
  { code: '+20', label: 'مصر', flag: '🇪🇬' },
]

export function normalizeCountryCallingCode(value?: string | null): string {
  if (!value) return DEFAULT_COUNTRY_CALLING_CODE
  const digits = String(value).replace(/[^0-9]/g, '')
  return digits ? `+${digits}` : DEFAULT_COUNTRY_CALLING_CODE
}

export function normalizePhoneNumber(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[^0-9+]/g, '')
}

export function cleanPhoneNumber(phoneNumber: string, countryCallingCode?: string): string {
  let clean = normalizePhoneNumber(phoneNumber).replace(/^\+/, '')
  const code = normalizeCountryCallingCode(countryCallingCode).replace(/^\+/, '')

  if (clean.startsWith(code)) {
    clean = clean.slice(code.length)
  }

  return clean
}

export function getPhoneDisplay(phoneNumber?: string | null, countryCallingCode?: string | null): string {
  if (!phoneNumber) return ''
  return `${normalizeCountryCallingCode(countryCallingCode)} ${phoneNumber}`
}
