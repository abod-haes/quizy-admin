import { useMemo, useState } from 'react'

import { mergeColumnsConfigWithDefault } from '@/shared/lib/table-page.helpers'
import {
  getPageSettings,
  resetPageSettings,
  setPageSettings,
  type TableColumnConfig,
  type TablePaginationState,
} from '@/shared/lib/table-settings-storage'

type UseCrudTableSettingsOptions = {
  pageKey: string
  defaultColumns: TableColumnConfig[]
  defaultSearchValues: Record<string, string>
  defaultPagination?: TablePaginationState
}

function normalizeSearchValues(
  value: unknown,
  fallback: Record<string, string>
): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback
  }

  const next: Record<string, string> = { ...fallback }

  for (const key of Object.keys(fallback)) {
    const rawValue = (value as Record<string, unknown>)[key]
    next[key] = typeof rawValue === 'string' ? rawValue : fallback[key]
  }

  return next
}

function normalizePagination(
  value: unknown,
  fallback: TablePaginationState
): TablePaginationState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback
  }

  const raw = value as Partial<TablePaginationState>
  const pageIndex =
    typeof raw.pageIndex === 'number' && Number.isFinite(raw.pageIndex) && raw.pageIndex > 0
      ? Math.trunc(raw.pageIndex)
      : fallback.pageIndex
  const pageSize =
    typeof raw.pageSize === 'number' && Number.isFinite(raw.pageSize) && raw.pageSize > 0
      ? Math.trunc(raw.pageSize)
      : fallback.pageSize
  const sort = typeof raw.sort === 'string' ? raw.sort : fallback.sort

  return {
    pageIndex,
    pageSize,
    sort,
  }
}

export function useCrudTableSettings({
  pageKey,
  defaultColumns,
  defaultSearchValues,
  defaultPagination = { pageIndex: 1, pageSize: 10, sort: 'created_at' },
}: UseCrudTableSettingsOptions) {
  const storedSettings = getPageSettings(pageKey)
  const [columns, setColumnsState] = useState<TableColumnConfig[]>(
    mergeColumnsConfigWithDefault(storedSettings?.columns, defaultColumns)
  )
  const [searchValues, setSearchValuesState] = useState<Record<string, string>>(
    normalizeSearchValues(storedSettings?.search, defaultSearchValues)
  )
  const [pagination, setPaginationState] = useState<TablePaginationState>(
    normalizePagination(storedSettings?.pagination, defaultPagination)
  )

  const visibleColumnKeys = useMemo(
    () => columns.filter((column) => column.visible).map((column) => column.id),
    [columns]
  )

  const activeFiltersCount = useMemo(
    () =>
      Object.values(searchValues).filter((value) => String(value).trim().length > 0).length,
    [searchValues]
  )

  const persist = (
    nextColumns: TableColumnConfig[],
    nextSearchValues: Record<string, string>,
    nextPagination: TablePaginationState
  ) => {
    setPageSettings(pageKey, {
      columns: nextColumns,
      defaultColumns,
      search: nextSearchValues,
      pagination: nextPagination,
    })
  }

  const setColumns = (nextColumns: TableColumnConfig[]) => {
    setColumnsState(nextColumns)
    persist(nextColumns, searchValues, pagination)
  }

  const setSearchValue = (key: string, value: string) => {
    const nextSearchValues = {
      ...searchValues,
      [key]: value,
    }
    setSearchValuesState(nextSearchValues)
    persist(columns, nextSearchValues, { ...pagination, pageIndex: 1 })
    setPaginationState((previous) => ({ ...previous, pageIndex: 1 }))
  }

  const setSearchValues = (nextSearchValues: Record<string, string>) => {
    setSearchValuesState(nextSearchValues)
    persist(columns, nextSearchValues, { ...pagination, pageIndex: 1 })
    setPaginationState((previous) => ({ ...previous, pageIndex: 1 }))
  }

  const setPagination = (nextPagination: TablePaginationState) => {
    setPaginationState(nextPagination)
    persist(columns, searchValues, nextPagination)
  }

  const reset = () => {
    const nextColumns = defaultColumns
    const nextSearchValues = defaultSearchValues

    setColumnsState(nextColumns)
    setSearchValuesState(nextSearchValues)
    setPaginationState(defaultPagination)
    resetPageSettings(pageKey, {
      columns: nextColumns,
      defaultColumns,
      search: nextSearchValues,
      pagination: defaultPagination,
    })
  }

  return {
    columns,
    searchValues,
    pagination,
    visibleColumnKeys,
    activeFiltersCount,
    setColumns,
    setSearchValue,
    setSearchValues,
    setPagination,
    reset,
  }
}
