import { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'

type TranslationRecord = Record<string, unknown>

export function pickTranslationByLocale<T extends TranslationRecord>(
  translations: unknown,
  locale: string
): T | null {
  if (!Array.isArray(translations) || translations.length === 0) {
    return null
  }

  const normalizedLocale = String(locale ?? '').toLowerCase()
  const byExactLocale = translations.find((entry) => {
    if (!entry || typeof entry !== 'object') return false
    const lang = String((entry as TranslationRecord).lang ?? '').toLowerCase()
    return lang === normalizedLocale
  })

  if (byExactLocale && typeof byExactLocale === 'object') {
    return byExactLocale as T
  }

  const baseLocale = normalizedLocale.split('-')[0]
  const byBaseLocale = translations.find((entry) => {
    if (!entry || typeof entry !== 'object') return false
    const lang = String((entry as TranslationRecord).lang ?? '').toLowerCase()
    return lang === baseLocale
  })

  if (byBaseLocale && typeof byBaseLocale === 'object') {
    return byBaseLocale as T
  }

  const firstObject = translations.find((entry) => entry && typeof entry === 'object')
  return firstObject && typeof firstObject === 'object' ? (firstObject as T) : null
}

export function formatTranslationForLocale(
  translations: unknown,
  locale: string,
  preferredFields: string[]
): string {
  const selected = pickTranslationByLocale<TranslationRecord>(translations, locale)
  if (!selected) return '-'

  for (const field of preferredFields) {
    const value = String(selected[field] ?? '').trim()
    if (value) return value
  }

  return '-'
}

export function formatTranslationList(
  translations: unknown,
  preferredFields: string[]
): string {
  if (!Array.isArray(translations) || translations.length === 0) {
    return '-'
  }

  return translations
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return formatUiDisplayValue(entry)
      }

      const item = entry as TranslationRecord
      const lang = String(item.lang ?? '').trim()
      const value =
        preferredFields
          .map((field) => String(item[field] ?? '').trim())
          .find((fieldValue) => fieldValue.length > 0) ?? ''

      if (!lang && !value) return '-'
      if (lang && value) return `${lang}: ${value}`
      return lang || value
    })
    .join(' | ')
}
