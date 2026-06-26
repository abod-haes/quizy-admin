import type { PaginationQuery, PagedResponse } from '@/shared/api/api.types'
import { api } from '@/shared/api/api-client'
import type { CrudEndpointConfig } from '@/shared/crud/crud.types'

export async function fetchCrudList<TItem, TFilters extends Record<string, unknown> = Record<string, unknown>>(
  endpoints: CrudEndpointConfig,
  filters?: TFilters & PaginationQuery
): Promise<PagedResponse<TItem>> {
  return api.get<PagedResponse<TItem>>(endpoints.list, { params: filters })
}

export async function fetchCrudDetails<TDetails>(
  endpoints: CrudEndpointConfig,
  id: string
): Promise<TDetails> {
  if (!endpoints.detail) {
    throw new Error('CRUD details endpoint is not configured')
  }

  return api.get<TDetails>(endpoints.detail(id))
}

export async function createCrudItem<TResponse, TBody>(
  endpoints: CrudEndpointConfig,
  body: TBody
): Promise<TResponse> {
  if (!endpoints.create) {
    throw new Error('CRUD create endpoint is not configured')
  }

  return api.post<TResponse, TBody>(endpoints.create, body)
}

export async function updateCrudItem<TResponse, TBody>(
  endpoints: CrudEndpointConfig,
  id: string,
  body: TBody
): Promise<TResponse> {
  if (!endpoints.update) {
    throw new Error('CRUD update endpoint is not configured')
  }

  return api.put<TResponse, TBody>(endpoints.update(id), body)
}

export async function removeCrudItem<TResponse>(
  endpoints: CrudEndpointConfig,
  id: string
): Promise<TResponse> {
  if (!endpoints.remove) {
    throw new Error('CRUD delete endpoint is not configured')
  }

  return api.delete<TResponse>(endpoints.remove(id))
}
