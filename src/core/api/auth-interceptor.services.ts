import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

import { env } from '@/shared/config/env'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import {
  clearAuthSession,
  getAuthRefreshToken,
  getAuthToken,
  setAuthRefreshToken,
  setAuthToken,
} from '@/shared/lib/auth-storage'

type RetryableRequestConfig = InternalAxiosRequestConfig & { _quizyRetried?: boolean }
type RefreshResponse = {
  token?: string | null
  refreshToken?: string | null
  isAuthenticated?: boolean
}

let refreshPromise: Promise<string> | null = null

const authEndpoints = new Set<string>([
  API_ENDPOINTS.auth.login,
  API_ENDPOINTS.auth.refreshToken,
  API_ENDPOINTS.auth.revokeToken,
  API_ENDPOINTS.auth.forgotPassword,
  API_ENDPOINTS.auth.resetPassword,
])

function endSession() {
  clearAuthSession()
  window.dispatchEvent(new CustomEvent('auth:unauthorized'))
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  const refreshToken = getAuthRefreshToken()
  if (!refreshToken) throw new Error('Missing admin refresh token')

  refreshPromise = axios
    .post<RefreshResponse>(
      API_ENDPOINTS.auth.refreshToken,
      { refreshToken },
      {
        baseURL: env.apiBaseUrl,
        timeout: 20000,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      },
    )
    .then((response) => {
      const nextAccessToken = response.data.token?.trim()
      const nextRefreshToken = response.data.refreshToken?.trim()
      if (!nextAccessToken || !nextRefreshToken || response.data.isAuthenticated === false) {
        throw new Error('Invalid admin refresh response')
      }
      setAuthToken(nextAccessToken)
      setAuthRefreshToken(nextRefreshToken)
      return nextAccessToken
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export function attachAuthInterceptors(httpClient: AxiosInstance): void {
  httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAuthToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  httpClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status
      const config = error.config as RetryableRequestConfig | undefined
      const requestUrl = config?.url ?? ''

      if (
        status !== 401 ||
        !config ||
        config._quizyRetried ||
        authEndpoints.has(requestUrl)
      ) {
        if (status === 401 && authEndpoints.has(requestUrl)) {
          return Promise.reject(error)
        }
        return Promise.reject(error)
      }

      if (!getAuthRefreshToken()) {
        endSession()
        return Promise.reject(error)
      }

      try {
        config._quizyRetried = true
        const accessToken = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${accessToken}`
        return await httpClient.request(config)
      } catch {
        endSession()
        return Promise.reject(error)
      }
    },
  )
}
