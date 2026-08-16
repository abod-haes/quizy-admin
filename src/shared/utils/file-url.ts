import { API_ORIGIN } from '@/shared/config/api-origin'

const UUID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const LEGACY_RESOURCE_PATH = new RegExp(`(?:^|/)uploads/resources/(${UUID_PATTERN})(?:\\.[^/?#]+)?$`, 'i')
const RESOURCE_CONTENT_PATH = new RegExp(
  `(?:^|/)(?:api/)+(?:v1/admin/)?resources/(${UUID_PATTERN})/content$`,
  'i',
)

function normalizePathname(value: string): string {
  try {
    return new URL(value, `${API_ORIGIN}/`).pathname
  } catch {
    return value.split(/[?#]/, 1)[0] ?? value
  }
}

function resourceIdFromUrl(value: string): string | null {
  const pathname = normalizePathname(value)
  return pathname.match(LEGACY_RESOURCE_PATH)?.[1]
    ?? pathname.match(RESOURCE_CONTENT_PATH)?.[1]
    ?? null
}

export function generateResourceContentUrl(resourceId: string | null | undefined): string {
  const normalizedId = resourceId?.trim()
  if (!normalizedId) return ''
  return `${API_ORIGIN}/api/Resources/${encodeURIComponent(normalizedId)}/content`
}

export function generateFileUrl(path: string | null | undefined): string {
  const normalizedPath = path?.trim()
  if (!normalizedPath) return ''

  if (/^(blob:|data:)/i.test(normalizedPath)) {
    return normalizedPath
  }

  const resourceId = resourceIdFromUrl(normalizedPath)
  if (resourceId) {
    return generateResourceContentUrl(resourceId)
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath
  }

  const relativePath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
  return `${API_ORIGIN}${relativePath}`
}
