export type AdminListFilters = Record<string, string>
export type AdminListPagination = { page?: number; perPage?: number; sort?: string }

export function toAdminListQueryParams(
  filters: AdminListFilters,
  pagination: AdminListPagination = {}
): Record<string, string | number> {
  const params: Record<string, string | number> = {}

  for (const [key, value] of Object.entries(filters)) {
    const normalized = String(value ?? '').trim()
    if (!normalized) {
      continue
    }

    params[`filter[${key}]`] = normalized
  }

  if (typeof pagination.page === 'number' && Number.isFinite(pagination.page) && pagination.page > 0) {
    params.page = Math.trunc(pagination.page)
  }
  if (typeof pagination.perPage === 'number' && Number.isFinite(pagination.perPage) && pagination.perPage > 0) {
    params.perPage = Math.trunc(pagination.perPage)
  }
  if (typeof pagination.sort === 'string' && pagination.sort.trim()) {
    params.sort = pagination.sort.trim()
  }

  return params
}
