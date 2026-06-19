import { Columns3, RotateCcw } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export type ColumnVisibilityItem = {
  id: string
  label: string
  visible: boolean
  locked?: boolean
}

type ColumnsVisibilityMenuProps = {
  columns: ColumnVisibilityItem[]
  onChange: (columns: ColumnVisibilityItem[]) => void
  onReset?: () => void
  triggerLabel?: ReactNode
  triggerAriaLabel?: string
  title?: ReactNode
  description?: ReactNode
  applyLabel?: ReactNode
  resetLabel?: ReactNode
  triggerClassName?: string
}

const FILTER_TRIGGER_CLASS =
  'h-10 min-w-0 rounded-md border border-border bg-card px-4 py-1 text-sm font-medium text-foreground transition-[background-color,border-color,color] duration-150 hover:border-input hover:bg-muted/45 focus-visible:border-primary/55 focus-visible:ring-1 focus-visible:ring-primary/20 data-[state=open]:border-primary/55 data-[state=open]:ring-1 data-[state=open]:ring-primary/20'

export function ColumnsVisibilityMenu({
  columns,
  onChange,
  onReset,
  triggerLabel,
  triggerAriaLabel,
  title,
  description,
  applyLabel,
  resetLabel,
  triggerClassName,
}: ColumnsVisibilityMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [draftColumns, setDraftColumns] = useState(columns)
  const displayColumns = useMemo(
    () => draftColumns.filter((column) => column.label.trim().length > 0),
    [draftColumns]
  )

  const visibleOptionalCount = draftColumns.filter(
    (column) => !column.locked && column.visible
  ).length

  const handleToggle = (columnId: string, checked: boolean) => {
    setDraftColumns((previousColumns) =>
      previousColumns.map((column) =>
        column.id === columnId ? { ...column, visible: checked } : column
      )
    )
  }

  const canApply = useMemo(() => {
    if (draftColumns.length !== columns.length) return true
    return draftColumns.some((column, index) => {
      const original = columns[index]
      return (
        column.id !== original.id ||
        column.visible !== original.visible ||
        column.locked !== original.locked ||
        column.label !== original.label
      )
    })
  }, [columns, draftColumns])

  const handleApply = () => {
    onChange(draftColumns)
    setOpen(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftColumns(columns)
    }
    setOpen(nextOpen)
  }

  const handleReset = () => {
    if (onReset) {
      onReset()
      setOpen(false)
      return
    }

    const resetColumns = draftColumns.map((column) => ({
      ...column,
      visible: true,
    }))
    setDraftColumns(resetColumns)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          icon={<Columns3 className="size-4" />}
          aria-label={triggerAriaLabel}
          className={cn(FILTER_TRIGGER_CLASS, triggerClassName)}
        >
          {triggerLabel ?? t('common.table.columns', { ns: 'translation' })}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        {title || description ? (
          <DialogHeader>
            {title ? <DialogTitle>{title}</DialogTitle> : null}
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
        ) : null}

        <div className="max-h-[55vh] space-y-2 overflow-y-auto pe-1">
          {displayColumns.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
              {t('common.table.noColumns', { ns: 'translation' })}
            </p>
          ) : displayColumns.map((column) => {
            const canHideColumn =
              !column.locked && !(column.visible && visibleOptionalCount <= 1)

            return (
              <label
                key={column.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm',
                  column.locked && 'bg-muted/40'
                )}
              >
                <span className="truncate text-foreground">{column.label}</span>
                <input
                  type="checkbox"
                  checked={column.visible}
                  disabled={column.locked || !canHideColumn}
                  onChange={(event) => {
                    handleToggle(column.id, event.target.checked)
                  }}
                  className="size-4 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
            )
          })}
        </div>

        <DialogFooter className="sm:justify-between">
          {resetLabel ? (
            <Button
              type="button"
              variant="outline"
              icon={<RotateCcw className="size-3.5" />}
              onClick={handleReset}
            >
              {resetLabel}
            </Button>
          ) : (
            <span />
          )}

          <Button type="button" onClick={handleApply} disabled={!canApply}>
            {applyLabel ?? 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
