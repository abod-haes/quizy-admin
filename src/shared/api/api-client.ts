import type { AxiosRequestConfig } from 'axios'

import { httpClient } from '@/core/api/http.services'

export type RequestOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>

const emptyPagedResponse = {
  items: [],
  totalCount: 0,
  pageNumber: 1,
  pageSize: 0,
}

function isUnsupportedResourcesList(url: string, options?: RequestOptions) {
  return url === '/api/Resources' && Boolean(options?.params)
}

export const api = {
  async get<TResponse>(url: string, options?: RequestOptions): Promise<TResponse> {
    // Backend currently supports Resources upload/delete, but not listing.
    // Do not call GET /api/Resources because it returns 405 Method Not Allowed.
    if (isUnsupportedResourcesList(url, options)) {
      return emptyPagedResponse as TResponse
    }

    const response = await httpClient.get<TResponse>(url, options)
    return response.data
  },

  async post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions
  ): Promise<TResponse> {
    const response = await httpClient.post<TResponse>(url, body, options)
    return response.data
  },

  async put<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions
  ): Promise<TResponse> {
    const response = await httpClient.put<TResponse>(url, body, options)
    return response.data
  },

  async patch<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions
  ): Promise<TResponse> {
    const response = await httpClient.patch<TResponse>(url, body, options)
    return response.data
  },

  async delete<TResponse>(url: string, options?: RequestOptions): Promise<TResponse> {
    const response = await httpClient.delete<TResponse>(url, options)
    return response.data
  },

  async upload<TResponse>(url: string, formData: FormData, options?: RequestOptions): Promise<TResponse> {
    const response = await httpClient.post<TResponse>(url, formData, options)
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
