/* eslint-disable react-refresh/only-export-components */
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { FaqsEntity } from '@/modules/faqs/types/faqs.type'
import { toDateLabel } from '@/shared/lib/data-value.helpers'
import { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'
import { PaginatedDataTable, TableRowActionsMenu, type DataTableColumn, type TableRowActionItem } from '@/shared/ui'

const columns = [
  { key: 'section_id', labelKey: 'table.columns.sectionId', isDate: false },
  { key: 'sort_order', labelKey: 'table.columns.sortOrder', isDate: false },
  { key: 'is_active', labelKey: 'table.columns.isActive', isDate: false },
  { key: 'translations', labelKey: 'table.columns.translations', isDate: false },
  { key: 'created_at', labelKey: 'table.columns.createdAt', isDate: true },
  { key: 'updated_at', labelKey: 'table.columns.updatedAt', isDate: true },
]

export const FaqsTableColumns = columns

type FaqsTableProps = {
  rows: FaqsEntity[]
  visibleColumnKeys?: string[]
  searchValues?: Record<string, string>
  page: number
  pageSize: number
  totalItems?: number
  totalPages?: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  onView?: (row: FaqsEntity) => void
  onEdit?: (row: FaqsEntity) => void
  onDelete?: (row: FaqsEntity) => void
}

function renderCellValue(row: FaqsEntity, column: (typeof columns)[number], locale: string): string {
  const rawValue = (row as Record<string, unknown>)[column.key]

  if (column.isDate) {
    return toDateLabel(rawValue, { locale })
  }

  if (Array.isArray(rawValue)) {
    return rawValue.length ? rawValue.map((item) => formatUiDisplayValue(item)).join(' â€¢ ') : '-'
  }

  if (rawValue && typeof rawValue === 'object') {
    return formatUiDisplayValue(JSON.stringify(rawValue))
  }

  return formatUiDisplayValue(rawValue)
}

export function FaqsTable({
  rows,
  visibleColumnKeys,
  searchValues,
  page,
  pageSize,
  totalItems,
  totalPages: totalPagesFromServer,
  onPageChange,
  onPageSizeChange,
  canView = true,
  canEdit = true,
  canDelete = true,
  onView,
  onEdit,
  onDelete,
}: FaqsTableProps) {
  const { t, i18n } = useTranslation('faqs')

  const visibleColumns = useMemo(() => {
    if (!visibleColumnKeys?.length) {
      return columns
    }

    const visibleKeys = new Set(visibleColumnKeys)
    return columns.filter((column) => visibleKeys.has(column.key))
  }, [visibleColumnKeys])

  const normalizedSearchEntries = useMemo(
    () =>
      Object.entries(searchValues ?? {}).filter(([, value]) =>
        String(value ?? '').trim().length > 0
      ),
    [searchValues]
  )

  const filteredRows = useMemo(() => {
    if (!normalizedSearchEntries.length) {
      return rows
    }

    return rows.filter((row) =>
      normalizedSearchEntries.every(([key, value]) => {
        const rowValue = formatUiDisplayValue((row as Record<string, unknown>)[key])
        return rowValue.toLowerCase().includes(String(value).toLowerCase())
      })
    )
  }, [normalizedSearchEntries, rows])

  const isServerPaginated = typeof totalPagesFromServer === 'number' && Number.isFinite(totalPagesFromServer)
  const totalPages = isServerPaginated
    ? Math.max(1, Math.trunc(totalPagesFromServer))
    : Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safePage = isServerPaginated ? Math.max(1, page) : Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const pagedRows = isServerPaginated ? filteredRows : filteredRows.slice(startIndex, startIndex + pageSize)
  const totalCount = isServerPaginated ? Math.max(0, Math.trunc(totalItems ?? filteredRows.length)) : filteredRows.length

  const tableColumns = useMemo<DataTableColumn<FaqsEntity>[]>(() => {
    const mapped: DataTableColumn<FaqsEntity>[] = visibleColumns.map((column) => ({
      id: column.key,
      header: t(column.labelKey),
      renderCell: (row) => renderCellValue(row, column, i18n.language),
    }))

    const actions: TableRowActionItem<FaqsEntity>[] = []

    if (canView) {
      actions.push({
        key: 'view',
        label: t('common.actions.view', { ns: 'translation' }),
        icon: <Eye className="size-4" />,
        onClick: (row) => onView?.(row),
      })
    }

    if (canEdit) {
      actions.push({
        key: 'edit',
        label: t('common.actions.edit', { ns: 'translation' }),
        icon: <Pencil className="size-4" />,
        onClick: (row) => onEdit?.(row),
      })
    }

    if (canDelete) {
      actions.push({
        key: 'delete',
        label: t('common.actions.delete', { ns: 'translation' }),
        icon: <Trash2 className="size-4" />,
        variant: 'destructive',
        onClick: (row) => onDelete?.(row),
      })
    }

    if (actions.length) {
      mapped.push({
        id: 'actions',
        header: t('common.table.actions', { ns: 'translation' }),
        headerClassName: 'w-24 text-end',
        cellClassName: 'text-end',
        renderCell: (row) => (
          <div className="flex justify-end">
            <TableRowActionsMenu
              row={row}
              actions={actions}
              triggerAriaLabel={t('common.table.actions', { ns: 'translation' })}
            />
          </div>
        ),
      })
    }

    return mapped
  }, [visibleColumns, t, i18n.language, canView, canEdit, canDelete, onView, onEdit, onDelete])

  return (
    <PaginatedDataTable
      rows={pagedRows}
      columns={tableColumns}
      getRowId={(row) => String((row as Record<string, unknown>).id ?? Math.random())}
      emptyMessage={t('common.table.empty', { ns: 'translation' })}
      summaryText={t('common.table.summary', {
        ns: 'translation',
        from: totalCount ? startIndex + 1 : 0,
        to: Math.min(startIndex + pagedRows.length, totalCount),
        total: totalCount,
      })}
      pagination={{
        currentPage: safePage,
        totalPages,
        onPageChange,
        previousLabel: t('common.pagination.previous', { ns: 'translation' }),
        nextLabel: t('common.pagination.next', { ns: 'translation' }),
        getPageLabel: (nextPage) =>
          t('common.pagination.pageLabel', { ns: 'translation', page: nextPage }),
        pageSize,
        pageSizeOptions: [10, 20, 50, 100],
        onPageSizeChange,
        pageSizeLabel: t('common.pagination.pageSize', { ns: 'translation' }),
        pageSizeAriaLabel: t('common.pagination.pageSize', { ns: 'translation' }),
      }}
    />
  )
}
