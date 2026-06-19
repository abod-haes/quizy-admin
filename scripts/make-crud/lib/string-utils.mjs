export const NON_CRUD_SUFFIXES = new Set(['reorder', 'status', 'attach', 'detach', 'replace'])
export const IGNORED_PATH_SEGMENTS = new Set(['api', 'v1', 'admin'])
export const FILE_TOKEN = '__POSTMAN_FILE__'
export const ENUM_HINT_SUFFIXES = new Set(['status', 'type', 'category', 'kind', 'mode', 'level', 'role', 'lang'])

export const toKebab = (value) =>
  value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()

export const toPascal = (value) =>
  toKebab(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

export const toCamel = (value) => {
  const pascal = toPascal(value)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

export const toTitle = (value) =>
  toKebab(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export const ARABIC_SIDEBAR_LABELS = {
  pages: 'الصفحات',
  'page-sections': 'أقسام الصفحات',
  'section-items': 'عناصر القسم',
}

export const toSingularKebab = (value) => {
  const normalized = toKebab(value)

  if (normalized.endsWith('ies') && normalized.length > 3) {
    return `${normalized.slice(0, -3)}y`
  }

  if (
    (normalized.endsWith('sses') ||
      normalized.endsWith('ches') ||
      normalized.endsWith('shes') ||
      normalized.endsWith('xes') ||
      normalized.endsWith('zes')) &&
    normalized.length > 2
  ) {
    return normalized.slice(0, -2)
  }

  if (normalized.endsWith('s') && !normalized.endsWith('ss') && normalized.length > 1) {
    return normalized.slice(0, -1)
  }

  return normalized
}

export const sanitizeKeySegment = (value) => toCamel(String(value).replace(/[^a-zA-Z0-9_\-]/g, '-'))
export const isDateFieldKey = (value) => {
  const normalized = String(value ?? '')
  return (
    /(^|_)(created|updated|deleted)_at$/i.test(normalized) ||
    /(^|_)(date|datetime|timestamp)$/i.test(normalized) ||
    /At$/.test(normalized)
  )
}
