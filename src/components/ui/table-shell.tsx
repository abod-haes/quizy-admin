import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { cn } from '@/lib/utils'

type TableShellProps = {
  children: ReactNode
  summaryText: string
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  previousLabel: string
  nextLabel: string
  getPageLabel: (page: number) => string
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
  pageSizeLabel?: string
  pageSizeAriaLabel?: string
  className?: string
}

export function TableShell({
  children,
  summaryText,
  currentPage,
  totalPages,
  onPageChange,
  previousLabel,
  nextLabel,
  getPageLabel,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  pageSizeLabel,
  pageSizeAriaLabel,
  className,
}: TableShellProps) {
  const { i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'

  const PreviousIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight
  const pageNumberFormatter = new Intl.NumberFormat(i18n.language)
  const normalizedPageSizeOptions = (pageSizeOptions ?? []).filter(
    (size, index, source) =>
      Number.isFinite(size) &&
      size > 0 &&
      Math.trunc(size) === size &&
      source.indexOf(size) === index
  )
  const showPageSizeSelector = Boolean(
    typeof pageSize === 'number' &&
      normalizedPageSizeOptions.length > 0 &&
      onPageSizeChange
  )
  const selectedPageSize =
    typeof pageSize === 'number' && pageSize > 0
      ? String(Math.trunc(pageSize))
      : String(normalizedPageSizeOptions[0] ?? '')

  return (
    <section
      className={cn(
        'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-[1.35rem] border border-border bg-card',
        className
      )}
    >
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</div>

      <div className="shrink-0 border-t border-border/80 bg-card px-3 py-3 sm:px-4">
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {showPageSizeSelector ? (
              <div className="flex items-center gap-1.5">
                {pageSizeLabel ? (
                  <span className="text-[11px] font-medium text-muted-foreground md:text-xs">
                    {pageSizeLabel}
                  </span>
                ) : null}
                <div className="w-18 min-w-18 md:w-20 md:min-w-20">
                  <CustomSelect
                    value={selectedPageSize}
                    ariaLabel={pageSizeAriaLabel}
                    className="h-8 rounded-md px-2 py-1 text-xs md:text-xs"
                    contentClassName="rounded-md p-1"
                    options={normalizedPageSizeOptions.map((size) => ({
                      value: String(size),
                      label: pageNumberFormatter.format(size),
                    }))}
                    onValueChange={(value) => {
                      const parsed = Number(value)
                      if (!Number.isFinite(parsed) || parsed <= 0) {
                        return
                      }
                      onPageSizeChange?.(Math.trunc(parsed))
                    }}
                  />
                </div>
              </div>
            ) : null}
            <p className="min-w-0 text-xs font-medium leading-5 text-muted-foreground">
              {summaryText}
            </p>
          </div>

          <div className="max-w-full overflow-x-auto pb-0.5">
            <div className="flex w-max items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                className="size-8 shrink-0"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                aria-label={previousLabel}
              >
                <PreviousIcon className="size-3.5" />
              </Button>

              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1
                const isActive = page === currentPage

                return (
                  <Button
                    key={page}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    size="icon-xs"
                    className="size-8 shrink-0 text-xs"
                    onClick={() => onPageChange(page)}
                    aria-label={getPageLabel(page)}
                  >
                    {pageNumberFormatter.format(page)}
                  </Button>
                )
              })}

              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                className="size-8 shrink-0"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                aria-label={nextLabel}
              >
                <NextIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
