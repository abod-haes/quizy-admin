import axios, { type AxiosInstance } from 'axios'

import { toApiError } from '@/core/api/api-error.type'
import { attachAuthInterceptors } from '@/core/api/auth-interceptor.services'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || ''
const LANGUAGE_STORAGE_KEY = 'app:language'
const SUPPORTED_LANGUAGES = new Set(['ar', 'en'])
const DEFAULT_LANGUAGE = 'ar'

function normalizeLanguage(value: string | null | undefined): string | null {
  if (!value) return null

  const shortCode = value.toLowerCase().split('-')[0]
  return SUPPORTED_LANGUAGES.has(shortCode) ? shortCode : null
}

function getCurrentLanguage(): string {
  if (typeof document !== 'undefined') {
    const documentLanguage = normalizeLanguage(document.documentElement.lang)
    if (documentLanguage) return documentLanguage
  }

  if (typeof window !== 'undefined') {
    const storedLanguage = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))
    if (storedLanguage) return storedLanguage
  }

  return DEFAULT_LANGUAGE
}

const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Accept-Language': getCurrentLanguage(),
  },
})

httpClient.interceptors.request.use((config) => {
  config.headers['X-Accept-Language'] = getCurrentLanguage()

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers['Content-Type'] = undefined
  }

  return config
})

attachAuthInterceptors(httpClient)

httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
)

export { httpClient }
