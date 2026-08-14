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
    <header
      data-slot="page-header"
      className={cn('w-full min-w-0 space-y-2.5', className)}
    >
      {breadcrumbs ? (
        <div data-slot="page-header-breadcrumbs" className="min-w-0">
          {breadcrumbs}
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
        <div className="min-w-0 flex-1">
          <h1
            data-slot="page-header-title"
            className="break-words font-[var(--font-sans)] text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl"
          >
            {title}
          </h1>
          {description ? (
            <p
              data-slot="page-header-description"
              className="max-w-4xl pt-1.5 text-sm font-medium leading-6 text-muted-foreground"
            >
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div
            data-slot="page-header-actions"
            className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end"
          >
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}
