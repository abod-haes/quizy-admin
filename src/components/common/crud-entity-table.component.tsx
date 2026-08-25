import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { toDateLabel } from '@/shared/lib/data-value.helpers'
import { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'
import {
  DataTable,
  TableRowActionsMenu,
  type DataTableColumn,
  type TableRowActionItem,
} from '@/shared/ui'

export type CrudTableColumn<TRow> = {
  key: string
  label: string
  isDate?: boolean
  className?: string
  render?: (row: TRow) => ReactNode
}

type CrudEntityTableProps<TRow> = {
  rows: TRow[]
  columns: CrudTableColumn<TRow>[]
  locale: string
  actionsLabel: string
  emptyLabel: string
  getRowId: (row: TRow) => string
  actions?: TableRowActionItem<TRow>[]
}

function toScalarLabel(value: unknown): string {
  return formatUiDisplayValue(value, { fallback: '' })
}

function formatObjectSummary(rawValue: Record<string, unknown>): string {
  const displayValue = rawValue.title ?? rawValue.name ?? rawValue.label ?? rawValue.slug ?? rawValue.value
  if (displayValue !== undefined && displayValue !== null) return toScalarLabel(displayValue)
  const keys = Object.keys(rawValue)
  return keys.length ? `${keys.length} fields` : '-'
}

function formatArraySummary(rawValue: unknown[]): string {
  if (!rawValue.length) return '-'
  const firstItem = rawValue[0]
  if (typeof firstItem !== 'object' || !firstItem || Array.isArray(firstItem)) {
    return rawValue.map((item) => toScalarLabel(item)).filter(Boolean).join(', ')
  }

  const translationsLike = rawValue.filter(
    (item) => item && typeof item === 'object' && !Array.isArray(item) && typeof (item as Record<string, unknown>).lang === 'string'
  ) as Record<string, unknown>[]

  if (translationsLike.length) {
    return translationsLike
      .map((item) => {
        const lang = toScalarLabel(item.lang).toUpperCase()
        const label = toScalarLabel(item.title) || toScalarLabel(item.name) || toScalarLabel(item.label) || toScalarLabel(item.description)
        return label ? `${lang}: ${label}` : lang
      })
      .filter(Boolean)
      .join(' | ')
  }

  return `${rawValue.length} items`
}

function renderDefaultCellValue(
  rawValue: unknown,
  isDate: boolean,
  locale: string,
  booleanLabels: { trueLabel: string; falseLabel: string }
): ReactNode {
  if (isDate) return toDateLabel(rawValue, { locale })
  if (typeof rawValue === 'boolean') return rawValue ? booleanLabels.trueLabel : booleanLabels.falseLabel
  if (Array.isArray(rawValue)) return formatArraySummary(rawValue)
  if (rawValue && typeof rawValue === 'object') return formatObjectSummary(rawValue as Record<string, unknown>)
  return formatUiDisplayValue(rawValue)
}

export function CrudEntityTable<TRow>({
  rows,
  columns,
  locale,
  actionsLabel,
  emptyLabel,
  getRowId,
  actions = [],
}: CrudEntityTableProps<TRow>) {
  const { t } = useTranslation()
  const booleanLabels = {
    trueLabel: t('common.boolean.yes', { ns: 'translation', defaultValue: 'Yes' }),
    falseLabel: t('common.boolean.no', { ns: 'translation', defaultValue: 'No' }),
  }

  const gridColumns: DataTableColumn<TRow>[] = columns.map((column) => ({
      id: column.key,
      header: column.label,
      cellClassName: column.className,
      renderCell: (row) => {
        const rawValue = (row as Record<string, unknown>)[column.key]
        return column.render
          ? column.render(row)
          : renderDefaultCellValue(rawValue, Boolean(column.isDate), locale, booleanLabels)
      },
    }))

  if (actions.length) {
    gridColumns.push({
        id: 'actions',
        header: actionsLabel,
        headerClassName: 'text-end',
        cellClassName: 'text-end',
        renderCell: (row) => (
          <div className="flex w-full justify-end">
            <TableRowActionsMenu row={row} actions={actions} triggerAriaLabel={actionsLabel} />
          </div>
        ),
    })
  }

  return (
    <div className="h-[min(60vh,40rem)] min-h-72 overflow-hidden rounded-md border border-border bg-card">
      <DataTable
        rows={rows}
        columns={gridColumns}
        getRowId={getRowId}
        emptyMessage={emptyLabel}
      />
    </div>
  )
}
