import { Search } from 'lucide-react'
import { isValidElement, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { FiltersDialog } from '@/components/ui/filters-dialog'
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
  controlsPresentation?: 'auto' | 'inline' | 'filters'
  filterLabel?: ReactNode
  filterTitle?: ReactNode
  filterDescription?: ReactNode
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
  controlsPresentation = 'auto',
  filterLabel,
  filterTitle,
  filterDescription,
  actions,
  className,
}: PageHeaderProps) {
  const { t } = useTranslation('common')

  const autoInlineControl = isValidElement(controls) && controls.type === Button
  const showControlsInline = Boolean(
    controls &&
      (controlsPresentation === 'inline' ||
        (controlsPresentation === 'auto' && autoInlineControl)),
  )
  const showControlsAsFilters = Boolean(
    controls &&
      (controlsPresentation === 'filters' ||
        (controlsPresentation === 'auto' && !autoInlineControl)),
  )
  const hasToolbar = Boolean(search || showControlsInline)
  const hasActions = Boolean(actions || showControlsAsFilters)

  return (
    <header
      data-slot="page-header"
      className={cn(
        'w-full min-w-0 shrink-0 rounded-[var(--quizy-surface-radius)] border border-primary/10 bg-card px-4 py-3.5 shadow-sm sm:px-5',
        className,
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
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--quizy-control-radius)] bg-primary/10 text-primary [&_svg]:size-5">
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

        {hasActions ? (
          <div
            data-slot="page-header-actions"
            className="flex w-full shrink-0 flex-wrap items-center gap-2 lg:w-auto lg:justify-end [&_[data-slot=button]_svg]:size-4"
          >
            {actions}
            {showControlsAsFilters ? (
              <FiltersDialog
                triggerLabel={filterLabel ?? t('filters.title')}
                title={filterTitle ?? t('filters.title')}
                description={filterDescription}
                applyLabel={t('actions.apply')}
                triggerVariant="filter"
                contentClassName="sm:max-w-2xl"
              >
                {controls}
              </FiltersDialog>
            ) : null}
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
                value={search.value}
                placeholder={search.placeholder}
                aria-label={search.ariaLabel ?? search.placeholder}
                disabled={search.disabled}
                onChange={(event) => search.onChange(event.currentTarget.value)}
              />
            </label>
          ) : null}

          {showControlsInline ? (
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
