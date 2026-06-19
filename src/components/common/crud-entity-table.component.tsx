import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { toDateLabel } from '@/shared/lib/data-value.helpers'
import { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'
import { cn } from '@/lib/utils'
import {
  TableRowActionsMenu,
  type TableRowActionItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  const displayValue =
    rawValue.title ??
    rawValue.name ??
    rawValue.label ??
    rawValue.slug ??
    rawValue.value

  if (displayValue !== undefined && displayValue !== null) {
    return toScalarLabel(displayValue)
  }

  const keys = Object.keys(rawValue)
  if (!keys.length) {
    return '-'
  }

  return `${keys.length} fields`
}

function formatArraySummary(rawValue: unknown[]): string {
  if (!rawValue.length) {
    return '-'
  }

  const firstItem = rawValue[0]

  if (typeof firstItem !== 'object' || !firstItem || Array.isArray(firstItem)) {
    return rawValue.map((item) => toScalarLabel(item)).filter(Boolean).join(', ')
  }

  const translationsLike = rawValue.filter(
    (item) =>
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      typeof (item as Record<string, unknown>).lang === 'string'
  ) as Record<string, unknown>[]

  if (translationsLike.length) {
    return translationsLike
      .map((item) => {
        const lang = toScalarLabel(item.lang).toUpperCase()
        const label =
          toScalarLabel(item.title) ||
          toScalarLabel(item.name) ||
          toScalarLabel(item.label) ||
          toScalarLabel(item.description)

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
  if (isDate) {
    return toDateLabel(rawValue, { locale })
  }

  if (typeof rawValue === 'boolean') {
    return rawValue ? booleanLabels.trueLabel : booleanLabels.falseLabel
  }

  if (Array.isArray(rawValue)) {
    return formatArraySummary(rawValue)
  }

  if (rawValue && typeof rawValue === 'object') {
    return formatObjectSummary(rawValue as Record<string, unknown>)
  }

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
  const hasActions = actions.length > 0
  const booleanLabels = {
    trueLabel: t('common.boolean.yes', { ns: 'translation', defaultValue: 'Yes' }),
    falseLabel: t('common.boolean.no', { ns: 'translation', defaultValue: 'No' }),
  }

  return (
    <Table
      containerClassName="overflow-x-auto rounded-md border border-border bg-card"
      className="min-w-[920px]"
    >
      <TableHeader>
        <TableRow className="bg-accent hover:bg-accent">
          {columns.map((column) => (
            <TableHead key={column.key} className="h-11 text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
              {column.label}
            </TableHead>
          ))}
          {hasActions ? (
            <TableHead className="h-11 w-20 text-right text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
              {actionsLabel}
            </TableHead>
          ) : null}
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={getRowId(row)} className={cn('align-top', index % 2 === 0 ? 'bg-background' : 'bg-muted/10')}>
            {columns.map((column) => {
              const rawValue = (row as Record<string, unknown>)[column.key]
              const cellValue = column.render
                ? column.render(row)
                : renderDefaultCellValue(rawValue, Boolean(column.isDate), locale, booleanLabels)

              return (
                <TableCell key={column.key} className={cn('py-3', column.className)}>
                  {cellValue}
                </TableCell>
              )
            })}
            {hasActions ? (
              <TableCell className="py-3 text-right">
                <TableRowActionsMenu
                  row={row}
                  actions={actions}
                  triggerAriaLabel={actionsLabel}
                />
              </TableCell>
            ) : null}
          </TableRow>
        ))}

        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length + (hasActions ? 1 : 0)}
              className="py-8 text-center text-sm text-muted-foreground"
            >
              {emptyLabel}
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  )
}
