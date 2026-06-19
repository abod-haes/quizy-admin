import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  breadcrumbs?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('space-y-1', className)}>
      {breadcrumbs}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-sans)] text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description ? <p className="pt-1 text-sm font-medium text-muted-foreground">{description}</p> : null}
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  )
}
