import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

import {
  clearAuthPermissions,
  clearAuthRoles,
  clearAuthToken,
  clearAuthUser,
  getAuthToken,
} from '@/shared/lib/auth-storage'

export function attachAuthInterceptors(httpClient: AxiosInstance): void {
  httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAuthToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  httpClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        clearAuthPermissions()
        clearAuthRoles()
        clearAuthToken()
        clearAuthUser()
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }

      return Promise.reject(error)
    },
  )
}
