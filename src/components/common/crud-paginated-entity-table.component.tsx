import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { CrudTableColumn } from '@/components/common/crud-entity-table.component'
import { CrudEntityTable } from '@/components/common/crud-entity-table.component'
import { Button, type TableRowActionItem } from '@/shared/ui'

type CrudPaginatedEntityTableProps<TRow> = {
  rows: TRow[]
  columns: CrudTableColumn<TRow>[]
  locale: string
  actionsLabel: string
  emptyLabel: string
  getRowId: (row: TRow) => string
  actions?: TableRowActionItem<TRow>[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function CrudPaginatedEntityTable<TRow>({
  rows,
  columns,
  locale,
  actionsLabel,
  emptyLabel,
  getRowId,
  actions,
  currentPage,
  totalPages,
  onPageChange,
}: CrudPaginatedEntityTableProps<TRow>) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const safeTotalPages = Math.max(1, totalPages)
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages)
  const PreviousIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight

  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <CrudEntityTable
        rows={rows}
        columns={columns}
        locale={locale}
        actionsLabel={actionsLabel}
        emptyLabel={emptyLabel}
        getRowId={getRowId}
        actions={actions}
      />

      <div className="flex items-center justify-between border-t border-border/80 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          {t('common.pagination.pageOf', {
            ns: 'translation',
            current: safeCurrentPage,
            total: safeTotalPages,
            defaultValue: `Page ${safeCurrentPage} of ${safeTotalPages}`,
          })}
        </p>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="size-7"
            disabled={safeCurrentPage <= 1}
            onClick={() => onPageChange(safeCurrentPage - 1)}
            aria-label={t('common.pagination.previous', { ns: 'translation' })}
          >
            <PreviousIcon className="size-3.5" />
          </Button>

          {Array.from({ length: safeTotalPages }).map((_, index) => {
            const page = index + 1
            return (
              <Button
                key={page}
                type="button"
                variant={page === safeCurrentPage ? 'default' : 'outline'}
                size="icon-xs"
                className="size-7 text-xs"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )
          })}

          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="size-7"
            disabled={safeCurrentPage >= safeTotalPages}
            onClick={() => onPageChange(safeCurrentPage + 1)}
            aria-label={t('common.pagination.next', { ns: 'translation' })}
          >
            <NextIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
