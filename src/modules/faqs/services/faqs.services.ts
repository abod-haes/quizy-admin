import { httpClient } from '@/core/api/http.services'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { unwrapItem, unwrapList, unwrapPaginatedList, type PaginatedListResult } from '@/shared/lib/api/unwrap-api-payload'
import { toAdminListQueryParams, type AdminListFilters, type AdminListPagination } from '@/shared/lib/api/admin-list-query.helpers'
import type { FaqsEntity, FaqsCreatePayload, FaqsUpdatePayload } from '@/modules/faqs/types/faqs.type'

export async function listFaqs(filters: AdminListFilters = {}, pagination: AdminListPagination = {}): Promise<PaginatedListResult<FaqsEntity>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.faqs.list, {
    params: toAdminListQueryParams(filters, pagination),
  })
  return unwrapPaginatedList<FaqsEntity>(response.data)
}

export async function getFaqs(identifier: string | number): Promise<FaqsEntity> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.faqs.detail.replace(':id', String(identifier)))
  return unwrapItem<FaqsEntity>(response.data)
}

export async function createFaqs(payload: FaqsCreatePayload): Promise<FaqsEntity> {
  const response = await httpClient.post<unknown>(API_ENDPOINTS.faqs.create, payload)
  return unwrapItem<FaqsEntity>(response.data)
}

export async function updateFaqs(identifier: string | number, payload: FaqsUpdatePayload): Promise<FaqsEntity> {
  const response = await httpClient.patch<unknown>(API_ENDPOINTS.faqs.update.replace(':id', String(identifier)), payload)
  return unwrapItem<FaqsEntity>(response.data)
}

export async function removeFaqs(identifier: string | number): Promise<void> {
  await httpClient.delete(API_ENDPOINTS.faqs.remove.replace(':id', String(identifier)))
}
