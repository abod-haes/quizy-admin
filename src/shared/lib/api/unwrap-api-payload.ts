export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as { data: unknown }).data
    if (Array.isArray(nested)) {
      return nested as T[]
    }
  }

  return []
}

export type PaginatedListResult<T> = {
  items: T[]
  currentPage: number
  perPage: number
  total: number
  lastPage: number
}

export function unwrapPaginatedList<T>(payload: unknown): PaginatedListResult<T> {
  const fallback: PaginatedListResult<T> = {
    items: [],
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  }

  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const record = payload as Record<string, unknown>
  const items = unwrapList<T>(payload)

  const meta = (record.meta && typeof record.meta === 'object' ? record.meta : null) as
    | Record<string, unknown>
    | null

  const currentPage = Number(meta?.current_page ?? record.current_page ?? 1)
  const perPage = Number(meta?.per_page ?? record.per_page ?? 10)
  const total = Number(meta?.total ?? record.total ?? items.length)
  const lastPage = Number(meta?.last_page ?? record.last_page ?? 1)

  return {
    items,
    currentPage: Number.isFinite(currentPage) && currentPage > 0 ? Math.trunc(currentPage) : 1,
    perPage: Number.isFinite(perPage) && perPage > 0 ? Math.trunc(perPage) : 10,
    total: Number.isFinite(total) && total >= 0 ? Math.trunc(total) : items.length,
    lastPage: Number.isFinite(lastPage) && lastPage > 0 ? Math.trunc(lastPage) : 1,
  }
}

export function unwrapItem<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }

  return payload as T
}
