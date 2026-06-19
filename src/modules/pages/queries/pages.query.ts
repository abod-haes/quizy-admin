import { queryOptions } from '@tanstack/react-query'

import { createCrudQueryKeys } from '@/shared/constants/crud-query-keys'
import type { AdminListFilters, AdminListPagination } from '@/shared/lib/api/admin-list-query.helpers'
import { listPages, getPages } from '@/modules/pages/services/pages.services'

export const pagesQueryKeys = createCrudQueryKeys('pages')

export function pagesListQueryOptions(filters: AdminListFilters = {}, pagination: AdminListPagination = {}) {
  return queryOptions({
    queryKey: pagesQueryKeys.list({ ...filters, __page: String(pagination.page ?? ''), __perPage: String(pagination.perPage ?? '') }),
    queryFn: () => listPages(filters, pagination),
  })
}

export function pagesDetailQueryOptions(identifier: string) {
  return queryOptions({
    queryKey: pagesQueryKeys.detail(identifier),
    queryFn: () => getPages(identifier),
  })
}
