import { queryOptions } from '@tanstack/react-query'

import { createCrudQueryKeys } from '@/shared/constants/crud-query-keys'
import type { AdminListFilters, AdminListPagination } from '@/shared/lib/api/admin-list-query.helpers'
import { listFaqs, getFaqs } from '@/modules/faqs/services/faqs.services'

export const faqsQueryKeys = createCrudQueryKeys('faqs')

export function faqsListQueryOptions(filters: AdminListFilters = {}, pagination: AdminListPagination = {}) {
  return queryOptions({
    queryKey: faqsQueryKeys.list({ ...filters, __page: String(pagination.page ?? ''), __perPage: String(pagination.perPage ?? '') }),
    queryFn: () => listFaqs(filters, pagination),
  })
}

export function faqsDetailQueryOptions(identifier: string) {
  return queryOptions({
    queryKey: faqsQueryKeys.detail(identifier),
    queryFn: () => getFaqs(identifier),
  })
}
