import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'

const AUTO_TRUNCATE_TEXT_LENGTH = 90
const PHONE_LIKE_COLUMN_KEYWORDS = ['phone', 'fax', 'mobile', 'landline', 'tel', 'whatsapp']

function isPhoneLikeColumn(columnId: string) {
  const normalizedId = columnId.replace(/[\s_-]/g, '').toLowerCase()
  return PHONE_LIKE_COLUMN_KEYWORDS.some((keyword) => normalizedId.includes(keyword))
}

function shouldForceLtrContent(columnId: string, value: ReactNode) {
  if (!isPhoneLikeColumn(columnId)) return false
  return typeof value === 'string' || typeof value === 'number'
}

function formatCellContent(columnId: string, value: ReactNode) {
  if (!isPhoneLikeColumn(columnId)) return value
  if (typeof value === 'string' || typeof value === 'number') {
    return formatUiDisplayValue(value, { isPhoneNumber: true, fallback: '-' })
  }
  return value
}

function renderHoverableTruncatedContent(value: ReactNode) {
  if (typeof value !== 'string' && typeof value !== 'number') return value
  const normalized = String(value).trim()
  if (!normalized || normalized.length <= AUTO_TRUNCATE_TEXT_LENGTH) return normalized || value
  return <span className="block max-w-[22rem] truncate" title={normalized}>{normalized}</span>
}

export type DataTableColumn<T> = {
  id: string
  header: ReactNode
  renderCell: (row: T) => ReactNode
  sortKey?: string
  headerClassName?: string
  cellClassName?: string | ((row: T) => string | undefined)
}

type DataTableProps<T> = {
  rows: T[]
  columns: DataTableColumn<T>[]
  getRowId: (row: T) => string
  loading?: boolean
  sort?: string
  onSortChange?: (sort?: string) => void
  emptyMessage?: ReactNode
  emptyStateClassName?: string
  rowClassName?: string | ((row: T) => string | undefined)
  tableClassName?: string
  tableContainerClassName?: string
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  loading = false,
  sort,
  onSortChange,
  emptyMessage,
  emptyStateClassName,
  rowClassName,
  tableClassName,
  tableContainerClassName,
}: DataTableProps<T>) {
  const normalizedSort = typeof sort === 'string' ? sort.trim() : ''

  return (
    <Table className={tableClassName} containerClassName={tableContainerClassName}>
      <TableHeader>
        <TableRow className="border-b border-primary/10 hover:bg-transparent">
          {columns.map((column) => (
            <TableHead
              key={column.id}
              className={cn(
                'sticky top-0 z-10 h-11 bg-accent/70 text-[0.72rem] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur',
                column.headerClassName
              )}
            >
              {column.sortKey && onSortChange ? (
                <button
                  type="button"
                  className="group inline-flex min-h-8 w-full items-center gap-2 rounded-lg text-start outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
                  onClick={() => {
                    const key = column.sortKey ?? ''
                    if (!key) return
                    const asc = key
                    const desc = `-${key}`
                    const next = normalizedSort === desc ? undefined : normalizedSort === asc ? desc : asc
                    onSortChange(next)
                  }}
                >
                  <span className="min-w-0 truncate">{column.header}</span>
                  <span className="shrink-0 text-muted-foreground/70 transition-colors group-hover:text-primary">
                    {normalizedSort === `-${column.sortKey}` ? (
                      <ArrowDown className="size-3.5" />
                    ) : normalizedSort === column.sortKey ? (
                      <ArrowUp className="size-3.5" />
                    ) : (
                      <ArrowUpDown className="size-3.5 opacity-55" />
                    )}
                  </span>
                </button>
              ) : column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {loading ? Array.from({ length: 7 }).map((_, rowIndex) => (
          <TableRow key={`skeleton-${rowIndex}`} className="border-primary/5 hover:bg-transparent">
            {columns.map((column, columnIndex) => (
              <TableCell key={`${column.id}-skeleton-${rowIndex}`} className="py-3.5">
                <Skeleton
                  className="h-4 rounded-full"
                  style={{ width: `${Math.max(38, 88 - ((columnIndex + rowIndex) % 4) * 12)}%`, maxWidth: 220 }}
                />
              </TableCell>
            ))}
          </TableRow>
        )) : null}

        {!loading ? rows.map((row) => (
          <TableRow
            key={getRowId(row)}
            className={cn(
              'border-primary/5 transition-colors duration-150 hover:bg-primary/[0.025]',
              typeof rowClassName === 'function' ? rowClassName(row) : rowClassName
            )}
          >
            {columns.map((column) => {
              const rawCellContent = column.renderCell(row)
              const cellContent = formatCellContent(column.id, rawCellContent)
              const displayedCellContent = renderHoverableTruncatedContent(cellContent)

              return (
                <TableCell
                  key={column.id}
                  className={cn(
                    'py-3.5 align-middle',
                    typeof column.cellClassName === 'function' ? column.cellClassName(row) : column.cellClassName
                  )}
                >
                  {shouldForceLtrContent(column.id, cellContent) ? (
                    <span dir="ltr" className="inline-block max-w-full [direction:ltr] [unicode-bidi:isolate]">
                      {displayedCellContent}
                    </span>
                  ) : displayedCellContent}
                </TableCell>
              )
            })}
          </TableRow>
        )) : null}

        {!loading && rows.length === 0 && emptyMessage ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columns.length} className={cn('p-4', emptyStateClassName)}>
              <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/15 bg-primary/[0.02] px-6 py-10 text-center">
                <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Inbox className="size-5" />
                </span>
                <div className="max-w-md text-sm font-medium leading-6 text-muted-foreground">{emptyMessage}</div>
              </div>
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  )
}
