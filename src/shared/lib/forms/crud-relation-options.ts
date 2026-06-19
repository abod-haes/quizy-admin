import { httpClient } from '@/core/api/http.services'
import { unwrapList } from '@/shared/lib/api/unwrap-api-payload'

export type CrudSelectOption = {
  label: string
  value: string
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return ''
}

function pickTranslationTitle(record: Record<string, unknown>): string {
  const translations = record.translations
  if (Array.isArray(translations)) {
    for (const entry of translations) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        continue
      }

      const title = (entry as Record<string, unknown>).title
      if (typeof title === 'string' && title.trim()) {
        return title.trim()
      }
    }
  }

  if (translations && typeof translations === 'object' && !Array.isArray(translations)) {
    const values = Object.values(translations as Record<string, unknown>)
    for (const entry of values) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        continue
      }

      const title = (entry as Record<string, unknown>).title
      if (typeof title === 'string' && title.trim()) {
        return title.trim()
      }
    }
  }

  return ''
}

function pickLabel(record: Record<string, unknown>): string {
  const translationTitle = pickTranslationTitle(record)
  if (translationTitle) {
    return translationTitle
  }

  const keys = [
    'name',
    'title',
    'label',
    'full_name',
    'slug',
    'email',
    'question',
    'id',
  ]

  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }

    if (typeof value === 'number') {
      return String(value)
    }
  }

  const fallback = Object.values(record).find((value) => typeof value === 'string' && value.trim())
  if (typeof fallback === 'string') {
    return fallback
  }

  return '-'
}

function pickValue(record: Record<string, unknown>): string {
  const idKeys = ['id', 'value', 'uuid', 'slug']
  for (const key of idKeys) {
    const resolved = toStringValue(record[key])
    if (resolved) {
      return resolved
    }
  }

  return ''
}

export async function fetchCrudRelationOptions(endpoint: string): Promise<CrudSelectOption[]> {
  if (!endpoint) {
    return []
  }

  const response = await httpClient.get<unknown>(endpoint)
  const rows = unwrapList<Record<string, unknown>>(response.data)

  return rows
    .map((row) => ({
      label: pickLabel(row),
      value: pickValue(row),
    }))
    .filter((option) => option.value)
}
