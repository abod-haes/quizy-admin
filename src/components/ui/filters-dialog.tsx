import { SlidersHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  'h-10 min-w-0 rounded-md border border-border bg-card px-4 py-1 text-sm font-medium text-foreground transition-[background-color,border-color,color] duration-150 hover:border-input hover:bg-muted/45 focus-visible:border-primary/55 focus-visible:ring-1 focus-visible:ring-primary/20 data-[state=open]:border-primary/55 data-[state=open]:ring-1 data-[state=open]:ring-primary/20'

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
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)
  }

  const handleApply = () => {
    onApply?.()

    if (closeOnApply) {
      handleOpenChange(false)
    }
  }

  const normalizedActiveFiltersCount =
    typeof activeFiltersCount === 'number' && Number.isFinite(activeFiltersCount)
      ? Math.max(0, Math.trunc(activeFiltersCount))
      : null

  const shouldShowActiveFiltersCount = normalizedActiveFiltersCount !== null

  const renderActiveFiltersCountBadge = () =>
    shouldShowActiveFiltersCount ? (
      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary/12 px-1.5 text-[11px] font-semibold leading-5 text-primary">
        {normalizedActiveFiltersCount}
      </span>
    ) : null

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          icon={<SlidersHorizontal className="size-4" />}
          className={cn(
            triggerVariant === 'filter' && FILTER_TRIGGER_CLASS,
            triggerClassName
          )}
        >
          <span className="inline-flex items-center gap-2">
            <span>{triggerLabel}</span>
            {renderActiveFiltersCountBadge()}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className={cn('', contentClassName)}>
        {title || description ? (
          <DialogHeader>
            {title ? (
              <DialogTitle>{title}</DialogTitle>
            ) : null}
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">{children}</div>

        {applyLabel || resetLabel ? (
          <DialogFooter className="sm:justify-between">
            {resetLabel ? (
              <Button type="button" variant="outline" onClick={onReset}>
                {resetLabel}
              </Button>
            ) : (
              <span />
            )}

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
