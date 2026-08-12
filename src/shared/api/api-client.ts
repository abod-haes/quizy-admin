import type { AxiosRequestConfig } from 'axios'

import { httpClient } from '@/core/api/http.services'

export type RequestOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>

type QueryParams = Record<string, unknown>

function normalizeNestRequestOptions(options?: RequestOptions): RequestOptions | undefined {
  if (!options?.params || typeof options.params !== 'object' || Array.isArray(options.params)) {
    return options
  }

  const params = options.params as QueryParams
  const { Page, PerPage, ...rest } = params
  const normalizedParams: QueryParams = { ...rest }

  // Keep one compatibility boundary while the last generic CRUD screen is being migrated.
  // Nest admin list DTOs use lower-case page/perPage everywhere.
  if (normalizedParams.page === undefined && Page !== undefined) normalizedParams.page = Page
  if (normalizedParams.perPage === undefined && PerPage !== undefined) normalizedParams.perPage = PerPage

  return { ...options, params: normalizedParams }
}

export const api = {
  async get<TResponse>(url: string, options?: RequestOptions): Promise<TResponse> {
    const response = await httpClient.get<TResponse>(url, normalizeNestRequestOptions(options))
    return response.data
  },

  async post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<TResponse> {
    const response = await httpClient.post<TResponse>(url, body, normalizeNestRequestOptions(options))
    return response.data
  },

  async put<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<TResponse> {
    const response = await httpClient.put<TResponse>(url, body, normalizeNestRequestOptions(options))
    return response.data
  },

  async patch<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<TResponse> {
    const response = await httpClient.patch<TResponse>(url, body, normalizeNestRequestOptions(options))
    return response.data
  },

  async delete<TResponse>(url: string, options?: RequestOptions): Promise<TResponse> {
    const response = await httpClient.delete<TResponse>(url, normalizeNestRequestOptions(options))
    return response.data
  },

  async upload<TResponse>(
    url: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<TResponse> {
    const response = await httpClient.post<TResponse>(url, formData, normalizeNestRequestOptions(options))
    return response.data
  },

  async downloadBlob(url: string, options?: RequestOptions): Promise<Blob> {
    const normalizedOptions = normalizeNestRequestOptions(options)
    const response = await httpClient.get<Blob>(url, {
      ...normalizedOptions,
      responseType: 'blob',
    })

    return response.data
  },
}
