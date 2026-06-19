import { APP_LABELS, APP_LABEL_VALUES, type AppLabel } from '@/shared/constants/labels'

const LABEL_TRANSLATION_KEYS: Record<AppLabel, string> = {
  [APP_LABELS.PENDING]: 'common.labels.pending',
}

const LABEL_ALIASES: Record<string, AppLabel> = {
  pending: APP_LABELS.PENDING,
}

function normalizeLabelKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

export function toAppLabel(value: unknown): AppLabel | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return null
  }

  const exactMatch = APP_LABEL_VALUES.find(
    (label) => label.toLowerCase() === normalizedValue.toLowerCase()
  )

  if (exactMatch) {
    return exactMatch
  }

  const normalizedKey = normalizeLabelKey(normalizedValue)
  return LABEL_ALIASES[normalizedKey] ?? null
}

export function toAppLabels(value: unknown): AppLabel[] {
  if (!Array.isArray(value)) {
    return []
  }

  const uniqueLabels = new Set<AppLabel>()

  for (const item of value) {
    const normalizedLabel = toAppLabel(item)

    if (normalizedLabel) {
      uniqueLabels.add(normalizedLabel)
    }
  }

  return Array.from(uniqueLabels)
}

export function getAppLabelTranslationKey(label: AppLabel): string {
  return LABEL_TRANSLATION_KEYS[label]
}
