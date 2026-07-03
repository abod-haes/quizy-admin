import { env } from '@/shared/config/env'

function getBaseFileUrl(): string {
  const configuredBaseUrl = env.apiBaseUrl.trim().replace(/^"|"$/g, '')

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/api\/?$/i, '').replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/api\/?$/i, '').replace(/\/$/, '')
  }

  return ''
}

export function generateFileUrl(path: string | null | undefined): string {
  const normalizedPath = path?.trim()
  if (!normalizedPath) return ''

  if (/^(blob:|data:|https?:\/\/)/i.test(normalizedPath)) {
    return normalizedPath
  }

  const baseUrl = getBaseFileUrl()
  if (!baseUrl) return normalizedPath

  if (!normalizedPath.startsWith('/')) {
    return `${baseUrl}/${normalizedPath}`
  }

  return `${baseUrl}${normalizedPath}`
}
