import type { AxiosRequestConfig } from 'axios'

import { httpClient } from '@/core/api/http.services'

export type RequestOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>

const LEGACY_EDUCATIONAL_ADMIN_LISTS = new Set([
  '/api/v1/admin/classes',
  '/api/v1/admin/subjects',
  '/api/v1/admin/units',
  '/api/v1/admin/lessons',
  '/api/v1/admin/teachers',
])

function normalizeLegacyEducationalList<TResponse>(url: string, payload: TResponse): TResponse {
  if (!LEGACY_EDUCATIONAL_ADMIN_LISTS.has(url) || !Array.isArray(payload)) {
    return payload
  }

  const items = payload
  return {
    items,
    totalCount: items.length,
    pageNumber: 1,
    pageSize: Math.max(items.length, 1),
  } as TResponse
}

export const api = {
  async get<TResponse>(url: string, options?: RequestOptions): Promise<TResponse> {
    const response = await httpClient.get<TResponse>(url, options)
    return normalizeLegacyEducationalList(url, response.data)
  },

  async post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<TResponse> {
    const response = await httpClient.post<TResponse>(url, body, options)
    return response.data
  },

  async put<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<TResponse> {
    const response = await httpClient.put<TResponse>(url, body, options)
    return response.data
  },

  async patch<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<TResponse> {
    const response = await httpClient.patch<TResponse>(url, body, options)
    return response.data
  },

  async delete<TResponse>(url: string, options?: RequestOptions): Promise<TResponse> {
    const response = await httpClient.delete<TResponse>(url, options)
    return response.data
  },

  async upload<TResponse>(
    url: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<TResponse> {
    // Normal API requests keep the global 20-second timeout, but media uploads
    // can legitimately take several minutes on slower connections. Axios aborts
    // timed-out browser uploads, which Chrome reports as `(canceled)`.
    const response = await httpClient.post<TResponse>(url, formData, {
      timeout: 0,
      ...options,
    })
    return response.data
  },

  async downloadBlob(url: string, options?: RequestOptions): Promise<Blob> {
    const response = await httpClient.get<Blob>(url, {
      ...options,
      responseType: 'blob',
    })

    return response.data
  },
}
