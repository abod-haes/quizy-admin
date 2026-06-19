export const SUPPORTED_LANGUAGES = ['ar', 'en', 'fr'] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const SUPPORTED_LANGUAGE_OPTIONS: Array<{ value: SupportedLanguage; label: string }> = [
  { value: 'ar', label: 'Arabic' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
]
