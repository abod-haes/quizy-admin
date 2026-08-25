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

type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end'

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, totalPages])
  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < totalPages) pages.add(page)
  }

  if (currentPage <= 3) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1)
    pages.add(totalPages - 2)
    pages.add(totalPages - 3)
  }

  const ordered = [...pages]
    .filter((page) => page > 0 && page <= totalPages)
    .sort((a, b) => a - b)
  const items: PaginationItem[] = []

  ordered.forEach((page, index) => {
    const previous = ordered[index - 1]
    if (index > 0 && previous && page - previous > 1) {
      items.push(previous === 1 ? 'ellipsis-start' : 'ellipsis-end')
    }
    items.push(page)
  })

  return items
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
  const paginationItems = getPaginationItems(currentPage, totalPages)

  return (
    <section
      className={cn(
        'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden',
        className
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>

      <div className="shrink-0 border-t border-border/70 bg-background/55 px-3 py-3 sm:px-4">
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
                    className="h-8 rounded-xl px-2 py-1 text-xs md:text-xs"
                    contentClassName="rounded-xl p-1"
                    options={normalizedPageSizeOptions.map((size) => ({
                      value: String(size),
                      label: pageNumberFormatter.format(size),
                    }))}
                    onValueChange={(value) => {
                      const parsed = Number(value)
                      if (!Number.isFinite(parsed) || parsed <= 0) return
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

          <nav className="max-w-full" aria-label="Pagination">
            <div className="flex w-fit max-w-full items-center gap-1 rounded-xl bg-muted/55 p-1.5 shadow-sm">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                className="size-8 shrink-0 rounded-xl bg-card shadow-none"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                aria-label={previousLabel}
              >
                <PreviousIcon className="size-3.5" />
              </Button>

              {paginationItems.map((item) => {
                if (typeof item !== 'number') {
                  return (
                    <span
                      key={item}
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center text-xs font-semibold text-muted-foreground"
                    >
                      …
                    </span>
                  )
                }

                const isActive = item === currentPage
                return (
                  <Button
                    key={item}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    size="icon-xs"
                    className={cn(
                      'size-8 shrink-0 rounded-xl text-xs shadow-none',
                      !isActive && 'bg-card'
                    )}
                    onClick={() => onPageChange(item)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={getPageLabel(item)}
                  >
                    {pageNumberFormatter.format(item)}
                  </Button>
                )
              })}

              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                className="size-8 shrink-0 rounded-xl bg-card shadow-none"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                aria-label={nextLabel}
              >
                <NextIcon className="size-3.5" />
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </section>
  )
}
