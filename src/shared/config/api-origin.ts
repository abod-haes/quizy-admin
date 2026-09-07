import { env } from './env'

const DEFAULT_API_ORIGIN = 'https://quizy-staging.abdulrahman-hares.com'

// Keep every admin request, including token refresh, on the same API origin.
// Vercel deployments may leave VITE_API_BASE_URL empty; in that case we must
// fall back to the Nest backend rather than POSTing /api/* to the static UI host.
export const API_ORIGIN = env.apiBaseUrl || DEFAULT_API_ORIGIN
