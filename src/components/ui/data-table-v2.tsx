import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type GetRowIdParams,
  type RowClassParams,
  type SortChangedEvent,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { Inbox } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'

ModuleRegistry.registerModules([AllCommunityModule])

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
  return (
    <span className="block max-w-full truncate" title={normalized}>
      {normalized}
    </span>
  )
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
  rowDragManaged?: boolean
  onRowOrderChange?: (rows: T[]) => void
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
  rowDragManaged = false,
  onRowOrderChange,
}: DataTableProps<T>) {
  const { i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const gridRef = useRef<AgGridReact<T>>(null)
  const normalizedSort = typeof sort === 'string' ? sort.trim() : ''

  const sortableColumnById = useMemo(
    () => new Map(columns.filter((column) => column.sortKey).map((column) => [column.id, column])),
    [columns]
  )

  const columnDefs = useMemo<ColDef<T>[]>(
    () =>
      columns.map((column, columnIndex) => {
        const isActionsColumn = column.id === 'actions'
        const isImageColumn = /(^|[-_])image($|[-_])|photo|thumbnail/i.test(column.id)
        const canSort = Boolean(column.sortKey && onSortChange)
        const sortDirection = column.sortKey
          ? normalizedSort === `-${column.sortKey}`
            ? 'desc'
            : normalizedSort === column.sortKey
              ? 'asc'
              : null
          : null

        return {
          colId: column.id,
          headerName:
            typeof column.header === 'string' || typeof column.header === 'number'
              ? String(column.header)
              : '',
          headerComponent:
            typeof column.header === 'string' || typeof column.header === 'number'
              ? undefined
              : () => <span className="min-w-0 truncate">{column.header}</span>,
          headerClass: column.headerClassName,
          sortable: canSort,
          sort: sortDirection,
          comparator: canSort ? () => 0 : undefined,
          suppressMovable: isActionsColumn,
          resizable: !isActionsColumn,
          rowDrag: rowDragManaged && columnIndex === 0,
          flex: isActionsColumn || isImageColumn ? undefined : 1,
          pinned: isActionsColumn ? (isRtl ? 'left' : 'right') : undefined,
          lockPinned: isActionsColumn,
          width: isActionsColumn ? 210 : isImageColumn ? 120 : undefined,
          minWidth: isActionsColumn ? 210 : isImageColumn ? 100 : 140,
          maxWidth: isActionsColumn ? 240 : isImageColumn ? 180 : undefined,
          cellClass: (params) => {
            if (!params.data) return undefined
            return typeof column.cellClassName === 'function'
              ? column.cellClassName(params.data)
              : column.cellClassName
          },
          cellRenderer: (params: { data?: T }) => {
            if (!params.data) return null
            const rawCellContent = column.renderCell(params.data)
            const cellContent = formatCellContent(column.id, rawCellContent)
            const displayedCellContent = renderHoverableTruncatedContent(cellContent)

            return (
              <div
                className={cn(
                  'flex h-full min-w-0 items-center',
                  isActionsColumn ? 'w-full justify-end overflow-visible pe-1' : 'overflow-hidden'
                )}
              >
                {shouldForceLtrContent(column.id, cellContent) ? (
                  <span
                    dir="ltr"
                    className="inline-block min-w-0 max-w-full truncate [direction:ltr] [unicode-bidi:isolate]"
                  >
                    {displayedCellContent}
                  </span>
                ) : (
                  displayedCellContent
                )}
              </div>
            )
          },
        }
      }),
    [columns, isRtl, normalizedSort, onSortChange, rowDragManaged]
  )

  useEffect(() => {
    const api = gridRef.current?.api
    if (!api) return

    const state = columns
      .filter((column) => column.sortKey)
      .map((column) => ({
        colId: column.id,
        sort:
          normalizedSort === `-${column.sortKey}`
            ? ('desc' as const)
            : normalizedSort === column.sortKey
              ? ('asc' as const)
              : null,
      }))

    api.applyColumnState({ state, defaultState: { sort: null } })
  }, [columns, normalizedSort])

  const handleSortChanged = useCallback(
    (event: SortChangedEvent<T>) => {
      if (!onSortChange) return
      const active = event.api.getColumnState().find((state) => state.sort)
      if (!active) {
        if (normalizedSort) onSortChange(undefined)
        return
      }

      const column = sortableColumnById.get(active.colId)
      if (!column?.sortKey) return
      const nextSort = active.sort === 'desc' ? `-${column.sortKey}` : column.sortKey
      if (nextSort !== normalizedSort) onSortChange(nextSort)
    },
    [normalizedSort, onSortChange, sortableColumnById]
  )

  const handleRowDragEnd = useCallback(() => {
    if (!onRowOrderChange) return
    const api = gridRef.current?.api
    if (!api) return
    const nextRows: T[] = []
    api.forEachNodeAfterFilterAndSort((node) => {
      if (node.data) nextRows.push(node.data)
    })
    onRowOrderChange(nextRows)
  }, [onRowOrderChange])

  const getAgRowId = useCallback(
    (params: GetRowIdParams<T>) => getRowId(params.data),
    [getRowId]
  )

  const getRowClass = useCallback(
    (params: RowClassParams<T>) => {
      if (!params.data) return undefined
      return typeof rowClassName === 'function' ? rowClassName(params.data) : rowClassName
    },
    [rowClassName]
  )

  return (
    <div
      data-slot="ag-data-table"
      className={cn(
        'quizy-ag-grid relative h-full min-h-72 w-full min-w-0 overflow-hidden bg-card',
        tableContainerClassName,
        tableClassName
      )}
    >
      <AgGridReact<T>
        ref={gridRef}
        theme={themeQuartz}
        rowData={rows}
        columnDefs={columnDefs}
        getRowId={getAgRowId}
        getRowClass={getRowClass}
        enableRtl={isRtl}
        headerHeight={48}
        rowHeight={54}
        animateRows={!rowDragManaged}
        rowDragManaged={rowDragManaged}
        suppressMoveWhenRowDragging={rowDragManaged}
        onRowDragEnd={rowDragManaged ? handleRowDragEnd : undefined}
        onSortChanged={handleSortChanged}
        enableCellTextSelection
        ensureDomOrder
        suppressNoRowsOverlay
        suppressLoadingOverlay
      />

      {loading ? (
        <div className="absolute inset-x-0 top-12 bottom-0 z-10 w-full bg-card">
          {Array.from({ length: 7 }).map((_, rowIndex) => (
            <div
              key={`ag-skeleton-${rowIndex}`}
              className="flex h-[54px] w-full items-center gap-4 border-b border-border/50 px-4"
            >
              {columns.map((column) => (
                <div
                  key={`${column.id}-ag-skeleton-${rowIndex}`}
                  className={cn(
                    'h-3.5 min-w-0 animate-pulse rounded-xl bg-muted',
                    column.id === 'actions' ? 'w-40 shrink-0' : 'flex-1'
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {!loading && rows.length === 0 && emptyMessage ? (
        <div
          className={cn(
            'absolute inset-x-0 top-12 bottom-0 z-10 flex items-center justify-center bg-card/95 p-4',
            emptyStateClassName
          )}
        >
          <div className="flex min-h-48 w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-dashed border-primary/15 bg-primary/[0.02] px-6 py-10 text-center">
            <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Inbox className="size-5" />
            </span>
            <div className="max-w-md text-sm font-medium leading-6 text-muted-foreground">
              {emptyMessage}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
