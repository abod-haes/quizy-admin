import type { TableColumnConfig } from '@/shared/lib/table-settings-storage'

export function parseStoredString(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') {
    return fallback
  }

  return value
}

export function parsePageIndex(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 1
  }

  return Math.max(1, Math.trunc(value))
}

export function parsePageSize(
  value: unknown,
  defaultPageSize: number,
  pageSizeOptions: readonly number[]
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return defaultPageSize
  }

  const parsedValue = Math.max(1, Math.trunc(value))
  return pageSizeOptions.includes(parsedValue) ? parsedValue : defaultPageSize
}

export function mergeColumnsConfigWithDefault(
  storedColumns: TableColumnConfig[] | null | undefined,
  defaultColumnsConfig: TableColumnConfig[],
  lockedColumnIds: readonly string[] = []
): TableColumnConfig[] {
  if (!storedColumns?.length) {
    return defaultColumnsConfig
  }

  return defaultColumnsConfig.map((defaultColumn) => {
    const storedColumn = storedColumns.find((column) => column.id === defaultColumn.id)
    const isLocked = lockedColumnIds.includes(defaultColumn.id)

    if (!storedColumn) {
      return isLocked ? { ...defaultColumn, visible: true } : defaultColumn
    }

    return {
      ...defaultColumn,
      visible: isLocked ? true : storedColumn.visible,
    }
  })
}
