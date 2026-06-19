import { queryOptions } from '@tanstack/react-query'

import { createCrudQueryKeys } from '@/shared/constants/crud-query-keys'
import type { AdminListFilters, AdminListPagination } from '@/shared/lib/api/admin-list-query.helpers'
import { listProjects, getProjects } from '@/modules/projects/services/projects.services'

export const projectsQueryKeys = createCrudQueryKeys('projects')

export function projectsListQueryOptions(filters: AdminListFilters = {}, pagination: AdminListPagination = {}) {
  return queryOptions({
    queryKey: projectsQueryKeys.list({
      ...filters,
      __page: String(pagination.page ?? ''),
      __perPage: String(pagination.perPage ?? ''),
      __sort: String(pagination.sort ?? ''),
    }),
    queryFn: () => listProjects(filters, pagination),
  })
}

export function projectsDetailQueryOptions(identifier: string) {
  return queryOptions({
    queryKey: projectsQueryKeys.detail(identifier),
    queryFn: () => getProjects(identifier),
  })
}
