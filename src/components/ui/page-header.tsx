import { Search } from 'lucide-react'
import type { ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type PageHeaderSearch = {
  value: string
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
  onChange: (value: string) => void
}

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  breadcrumbs?: ReactNode
  icon?: ReactNode
  search?: PageHeaderSearch
  controls?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  icon,
  search,
  controls,
  actions,
  className,
}: PageHeaderProps) {
  const hasToolbar = Boolean(search || controls)

  return (
    <header
      data-slot="page-header"
      className={cn(
        'w-full min-w-0 shrink-0 rounded-2xl border border-primary/10 bg-card px-4 py-3.5 shadow-sm sm:px-5',
        className
      )}
    >
      {breadcrumbs ? (
        <div data-slot="page-header-breadcrumbs" className="mb-2 min-w-0">
          {breadcrumbs}
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {icon ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-5">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h1
              data-slot="page-header-title"
              className="break-words font-[var(--font-sans)] text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl"
            >
              {title}
            </h1>
            {description ? (
              <p
                data-slot="page-header-description"
                className="max-w-3xl pt-1 text-xs font-medium leading-5 text-muted-foreground sm:text-sm"
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div
            data-slot="page-header-actions"
            className="flex w-full shrink-0 flex-wrap items-center gap-2 lg:w-auto lg:justify-end [&_[data-slot=button]]:h-9 [&_[data-slot=button]]:rounded-xl [&_[data-slot=button]]:px-3 [&_[data-slot=button]]:text-xs [&_[data-slot=button]_svg]:size-3.5"
          >
            {actions}
          </div>
        ) : null}
      </div>

      {hasToolbar ? (
        <div
          data-slot="page-header-toolbar"
          className="mt-3 flex min-w-0 flex-col gap-2 border-t border-primary/10 pt-3 sm:flex-row sm:items-center"
        >
          {search ? (
            <label className="relative block min-w-0 flex-1">
              <Input
                startIcon={<Search className="size-4" />}
                className="h-9 rounded-xl text-sm shadow-none"
                value={search.value}
                placeholder={search.placeholder}
                aria-label={search.ariaLabel ?? search.placeholder}
                disabled={search.disabled}
                onChange={(event) => search.onChange(event.currentTarget.value)}
              />
            </label>
          ) : null}

          {controls ? (
            <div
              data-slot="page-header-controls"
              className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0 [&>*]:min-w-0"
            >
              {controls}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}
