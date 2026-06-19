export function getTextValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return ''
}

export function getNumberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim()

    if (!normalized) {
      return null
    }

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export function getSelectValue(value: unknown, emptyValue: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : emptyValue
  }

  return emptyValue
}

export function toOptionalInteger(value: string): number | null {
  const parsed = getNumberValue(value)

  if (parsed === null) {
    return null
  }

  const normalized = Math.trunc(parsed)
  return normalized > 0 ? normalized : null
}

export function toOptionalNumber(value: string): number | null {
  const parsed = getNumberValue(value)
  return parsed === null ? null : parsed
}

export function toPositiveIdString(value: unknown): string {
  const parsed = getNumberValue(value)

  if (parsed === null) {
    return ''
  }

  const normalized = Math.trunc(parsed)
  return normalized > 0 ? String(normalized) : ''
}

export function toDatePickerValue(value: unknown): Date | undefined {
  const normalizedValue = getTextValue(value).trim()

  if (!normalizedValue) {
    return undefined
  }

  const parsedDate = new Date(normalizedValue.replace(' ', 'T'))
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate
}

export function toDateOnlyValue(date: Date | undefined): string {
  if (!date) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
