import { SlidersHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'

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

type FiltersDialogProps = {
  children: ReactNode
  triggerLabel: ReactNode
  title?: ReactNode
  description?: ReactNode
  activeFiltersCount?: number
  applyLabel?: ReactNode
  resetLabel?: ReactNode
  open?: boolean
  defaultOpen?: boolean
  closeOnApply?: boolean
  onOpenChange?: (open: boolean) => void
  onApply?: () => void
  onReset?: () => void
  triggerClassName?: string
  contentClassName?: string
  triggerVariant?: 'default' | 'filter'
}

const FILTER_TRIGGER_CLASS =
  'h-11 min-w-0 rounded-xl border border-primary/10 bg-card px-4 text-sm font-medium text-foreground shadow-[var(--quizy-control-shadow)] transition-[background-color,border-color,box-shadow] duration-150 hover:border-primary/25 hover:bg-muted/35 focus-visible:border-primary/55 focus-visible:ring-1 focus-visible:ring-primary/20 data-[state=open]:border-primary/55 data-[state=open]:shadow-[var(--quizy-control-focus-shadow)]'

export function FiltersDialog({
  children,
  triggerLabel,
  title,
  description,
  activeFiltersCount,
  applyLabel,
  resetLabel,
  open,
  defaultOpen = false,
  closeOnApply = true,
  onOpenChange,
  onApply,
  onReset,
  triggerClassName,
  contentClassName,
  triggerVariant = 'default',
}: FiltersDialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  const handleApply = () => {
    onApply?.()
    if (closeOnApply) handleOpenChange(false)
  }

  const normalizedActiveFiltersCount =
    typeof activeFiltersCount === 'number' && Number.isFinite(activeFiltersCount)
      ? Math.max(0, Math.trunc(activeFiltersCount))
      : null

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          icon={<SlidersHorizontal className="size-4" />}
          className={cn(triggerVariant === 'filter' && FILTER_TRIGGER_CLASS, triggerClassName)}
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="truncate">{triggerLabel}</span>
            {normalizedActiveFiltersCount !== null ? (
              <span className="inline-flex min-w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-bold leading-6 text-primary">
                {normalizedActiveFiltersCount}
              </span>
            ) : null}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className={cn('sm:max-w-3xl', contentClassName)}>
        {title || description ? (
          <DialogHeader>
            {title ? <DialogTitle>{title}</DialogTitle> : null}
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
        ) : null}

        <div data-slot="filters-grid" className="grid min-w-0 gap-4 sm:grid-cols-2">
          {children}
        </div>

        {applyLabel || resetLabel ? (
          <DialogFooter className="sm:justify-between">
            {resetLabel ? (
              <Button type="button" variant="outline" onClick={onReset}>
                {resetLabel}
              </Button>
            ) : <span />}

            {applyLabel ? (
              <Button type="button" onClick={handleApply}>
                {applyLabel}
              </Button>
            ) : null}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
