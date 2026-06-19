import { Eye, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Reorder } from 'framer-motion'

import type { ProjectsEntity } from '@/modules/projects/types/projects.type'
import { ProjectsTableColumns } from '@/modules/projects/components/projects.table-columns'
import { toDateLabel } from '@/shared/lib/data-value.helpers'
import { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'
import { formatTranslationForLocale, formatTranslationList } from '@/shared/lib/translation-display.helpers'
import {
  Badge,
  PaginatedDataTable,
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRowActionsMenu,
  TruncatedText,
  type DataTableColumn,
  type TableRowActionItem,
} from '@/shared/ui'

const columns = ProjectsTableColumns

type ProjectsTableProps = {
  rows: ProjectsEntity[]
  visibleColumnKeys?: string[]
  searchValues?: Record<string, string>
  page: number
  pageSize: number
  totalItems?: number
  totalPages?: number
  isLoading?: boolean
  sort?: string
  onSortChange?: (sort?: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  isOrderingEnabled?: boolean
  onReorderRows?: (rows: ProjectsEntity[]) => void
  onView?: (row: ProjectsEntity) => void
  onEdit?: (row: ProjectsEntity) => void
  onDelete?: (row: ProjectsEntity) => void
}

function formatStatusLabel(status: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (!status) return '-'
  return t(`table.values.status.${status}`, { defaultValue: formatUiDisplayValue(status) })
}

function formatCellValueForSearch(row: ProjectsEntity, key: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (key === 'translations') {
    return formatTranslationList((row as Record<string, unknown>)[key], ['title', 'short_description', 'location_name'])
  }

  if (key === 'status') {
    return formatStatusLabel(String(row.status ?? ''), t)
  }

  if (key === 'is_active') {
    return row.is_active
      ? t('table.values.active', { defaultValue: 'Active' })
      : t('table.values.inactive', { defaultValue: 'Inactive' })
  }

  if (key === 'is_featured') {
    return row.is_featured
      ? t('table.values.featured', { defaultValue: 'Featured' })
      : t('table.values.notFeatured', { defaultValue: 'Not Featured' })
  }

  if (key === 'media') {
    return String(Array.isArray(row.media) ? row.media.length : 0)
  }

  return formatUiDisplayValue((row as Record<string, unknown>)[key])
}

function renderCellValue(
  row: ProjectsEntity,
  column: (typeof columns)[number],
  locale: string,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  const rawValue = (row as Record<string, unknown>)[column.key]

  if (column.isDate) {
    return toDateLabel(rawValue, { locale })
  }

  if (column.key === 'status') {
    const status = String(rawValue ?? '')
    const color = status === 'published' ? 'emerald' : 'amber'
    return (
      <Badge variant="outline" color={color}>
        {formatStatusLabel(status, t)}
      </Badge>
    )
  }

  if (column.key === 'is_active') {
    const isActive = Boolean(rawValue)
    return (
      <Badge variant="outline" color={isActive ? 'emerald' : 'rose'}>
        {isActive
          ? t('table.values.active', { defaultValue: 'Active' })
          : t('table.values.inactive', { defaultValue: 'Inactive' })}
      </Badge>
    )
  }

  if (column.key === 'is_featured') {
    const isFeatured = Boolean(rawValue)
    return (
      <Badge variant="outline" color={isFeatured ? 'blue' : 'slate'}>
        {isFeatured
          ? t('table.values.featured', { defaultValue: 'Featured' })
          : t('table.values.notFeatured', { defaultValue: 'Not Featured' })}
      </Badge>
    )
  }

  if (column.key === 'translations') {
    return <TruncatedText text={formatTranslationForLocale(rawValue, locale, ['title', 'short_description', 'location_name'])} maxLength={70} />
  }

  if (Array.isArray(rawValue)) {
    return rawValue.length ? rawValue.map((item) => formatUiDisplayValue(item)).join(' • ') : '-'
  }

  if (rawValue && typeof rawValue === 'object') {
    return formatUiDisplayValue(JSON.stringify(rawValue))
  }

  return formatUiDisplayValue(rawValue)
}

export function ProjectsTable({
  rows,
  visibleColumnKeys,
  searchValues,
  page,
  pageSize,
  totalItems,
  totalPages: totalPagesFromServer,
  isLoading = false,
  sort,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  canView = true,
  canEdit = true,
  canDelete = true,
  isOrderingEnabled = false,
  onReorderRows,
  onView,
  onEdit,
  onDelete,
}: ProjectsTableProps) {
  const { t, i18n } = useTranslation('projects')

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
        const rowValue = formatCellValueForSearch(row, key, t)
        return rowValue.toLowerCase().includes(String(value).toLowerCase())
      })
    )
  }, [normalizedSearchEntries, rows, t])

  const isServerPaginated = typeof totalPagesFromServer === 'number' && Number.isFinite(totalPagesFromServer)
  const totalPages = isServerPaginated
    ? Math.max(1, Math.trunc(totalPagesFromServer))
    : Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safePage = isServerPaginated ? Math.max(1, page) : Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const pagedRows = isServerPaginated ? filteredRows : filteredRows.slice(startIndex, startIndex + pageSize)
  const totalCount = isServerPaginated ? Math.max(0, Math.trunc(totalItems ?? filteredRows.length)) : filteredRows.length

  const tableColumns = useMemo<DataTableColumn<ProjectsEntity>[]>(() => {
    const mapped: DataTableColumn<ProjectsEntity>[] = visibleColumns.map((column) => ({
      id: column.key,
      header: t(column.labelKey),
      sortKey: column.key === 'created_at' ? 'created_at' : undefined,
      renderCell: (row) => renderCellValue(row, column, i18n.language, t),
    }))

    const actions: TableRowActionItem<ProjectsEntity>[] = []

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

  if (isOrderingEnabled) {
    return (
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="border-b border-border/70 bg-muted/15 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-primary/10 p-2 text-primary">
              <GripVertical className="size-4" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {t('page.orderingTitle', {
                  defaultValue: 'Ordering mode is on',
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('page.orderingDescription', {
                  defaultValue: 'Drag rows using the grip handle, then click Save ordering when you finish.',
                })}
              </p>
            </div>
          </div>
        </div>
        <Table
          containerClassName="h-full w-full overflow-auto"
          className="min-w-full [&_thead_th]:h-12 [&_thead_th]:border-b [&_thead_th]:border-border/80 [&_thead_th]:bg-accent/60 [&_thead_th]:px-4 [&_thead_th]:py-3 [&_thead_th]:text-xs [&_thead_th]:font-semibold [&_thead_th]:tracking-[0.04em] [&_thead_th]:text-foreground [&_thead_th]:uppercase [&_tbody_td]:align-top">
          <TableHeader>
            <tr className="border-b border-border/80 hover:bg-transparent">
              <TableHead className="w-14 text-center">
                <span className="sr-only">
                  {t('page.dragLabel', {
                    defaultValue: 'Drag',
                  })}
                </span>
              </TableHead>
              {tableColumns.map((column) => (
                <TableHead key={column.id} className={column.headerClassName}>
                  {column.header}
                </TableHead>
              ))}
            </tr>
          </TableHeader>

          <Reorder.Group
            as="tbody"
            axis="y"
            values={rows}
            onReorder={onReorderRows ?? (() => undefined)}
            className="[&_tr:last-child]:border-0"
          >
            {rows.map((row) => (
              <Reorder.Item
                key={String(row.id)}
                as="tr"
                value={row}
                className="cursor-grab border-b border-border/70 bg-background transition-colors hover:bg-muted/35 active:cursor-grabbing"
              >
                <TableCell className="w-14 align-middle">
                  <div className="inline-flex items-center justify-center rounded-md border border-border/70 bg-muted/20 p-2 text-muted-foreground">
                    <GripVertical className="size-4" />
                  </div>
                </TableCell>
                {tableColumns.map((column) => (
                  <TableCell key={column.id} className={typeof column.cellClassName === 'function' ? column.cellClassName(row) : column.cellClassName}>
                    {column.renderCell(row)}
                  </TableCell>
                ))}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </Table>
      </div>
    )
  }

  return (
    <PaginatedDataTable
      rows={pagedRows}
      columns={tableColumns}
      loading={isLoading}
      sort={sort}
      onSortChange={onSortChange}
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

