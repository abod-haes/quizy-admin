import { env } from './env'

const DEFAULT_API_ORIGIN = 'https://quizy-staging.abdulrahman-hares.com'

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, '')
}

function pointsToAdminUi(configuredOrigin: string) {
  if (typeof window === 'undefined') return false

  try {
    return new URL(configuredOrigin, window.location.origin).origin === window.location.origin
  } catch {
    return true
  }
}

// The Vercel project may still have an old VITE_API_BASE_URL that points back to
// the dashboard host (or a relative /api value). Never let browser API calls use
// the static SPA host in that case: POST requests such as refresh-token would be
// handled by the SPA fallback and return 405 instead of reaching Nest.
const configuredOrigin = normalizeOrigin(env.apiBaseUrl)

export const API_ORIGIN =
  !configuredOrigin || pointsToAdminUi(configuredOrigin)
    ? DEFAULT_API_ORIGIN
    : configuredOrigin
