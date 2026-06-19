import { GripVertical } from 'lucide-react'

import { cn } from '@/lib/utils'

export function OrderingModeBanner({
  title,
  description,
  className,
}: {
  title: string
  description: string
  className?: string
}) {
  return (
    <div className={cn('mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3', className)}>
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-primary/10 p-2 text-primary">
          <GripVertical className="size-4" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}

export function OrderingDragHandle({
  label = 'Drag',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div className={cn('inline-flex items-center justify-center rounded-md border border-border/70 bg-muted/20 p-2 text-muted-foreground', className)}>
      <GripVertical className="size-4" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
