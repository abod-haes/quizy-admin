import { httpClient } from '@/core/api/http.services'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { unwrapItem, unwrapPaginatedList, type PaginatedListResult } from '@/shared/lib/api/unwrap-api-payload'
import { toAdminListQueryParams, type AdminListFilters, type AdminListPagination } from '@/shared/lib/api/admin-list-query.helpers'
import type { PagesEntity, PagesCreatePayload, PagesUpdatePayload } from '@/modules/pages/types/pages.type'

export async function listPages(filters: AdminListFilters = {}, pagination: AdminListPagination = {}): Promise<PaginatedListResult<PagesEntity>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.pages.list, {
    params: toAdminListQueryParams(filters, pagination),
  })
  return unwrapPaginatedList<PagesEntity>(response.data)
}

export async function getPages(identifier: string | number): Promise<PagesEntity> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.pages.detail.replace(':id', String(identifier)))
  return unwrapItem<PagesEntity>(response.data)
}

export async function createPages(payload: PagesCreatePayload): Promise<PagesEntity> {
  const response = await httpClient.post<unknown>(API_ENDPOINTS.pages.create, payload)
  return unwrapItem<PagesEntity>(response.data)
}

export async function updatePages(identifier: string | number, payload: PagesUpdatePayload): Promise<PagesEntity> {
  const response = await httpClient.patch<unknown>(API_ENDPOINTS.pages.update.replace(':id', String(identifier)), payload)
  return unwrapItem<PagesEntity>(response.data)
}

export async function removePages(identifier: string | number): Promise<void> {
  await httpClient.delete(API_ENDPOINTS.pages.remove.replace(':id', String(identifier)))
}
