import { type ReactNode, type UIEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  formatUiDisplayValue,
  looksLikePhoneText,
} from '@/shared/lib/display-format.helpers'

export type CustomSelectOption<T extends string | number = string> = {
  label: string
  value: T
  disabled?: boolean
}

type CustomSelectProps<T extends string | number = string> = {
  value?: T
  defaultValue?: T
  onValueChange?: (value: T) => void
  options: CustomSelectOption<T>[]
  placeholder?: string
  icon?: ReactNode
  name?: string
  required?: boolean
  disabled?: boolean
  id?: string
  ariaLabel?: string
  className?: string
  contentClassName?: string
  variant?: 'default' | 'filter'
  hasMoreOptions?: boolean
  isLoadingMoreOptions?: boolean
  onLoadMoreOptions?: () => void
  loadMoreThreshold?: number
}

const SELECT_TRIGGER_BASE_CLASS =
  'h-11 w-full min-w-0 rounded-xl border border-primary/10 bg-[var(--quizy-surface-strong)] px-3.5 text-sm font-medium text-foreground shadow-[var(--quizy-control-shadow)] outline-none transition-[transform,background-color,border-color,box-shadow] duration-200 hover:border-primary/25 hover:bg-card focus-visible:-translate-y-px focus-visible:border-primary/50 focus-visible:shadow-[var(--quizy-control-focus-shadow)] data-[state=open]:border-primary/50 data-[state=open]:shadow-[var(--quizy-control-focus-shadow)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-70 aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_4px_rgba(220,38,38,0.12)]'

const DEFAULT_TRIGGER_CLASS = SELECT_TRIGGER_BASE_CLASS
const FILTER_TRIGGER_CLASS = SELECT_TRIGGER_BASE_CLASS

function displayLabel(value: unknown, fallback: unknown): string {
  const label = typeof value === 'string' && value.trim() ? value : fallback
  const safeLabel = label === null || label === undefined ? '-' : String(label)

  return formatUiDisplayValue(safeLabel, {
    isPhoneNumber: looksLikePhoneText(safeLabel),
    stripIdTokens: true,
    fallback: safeLabel || '-',
  })
}

export function CustomSelect<T extends string | number = string>({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder,
  icon,
  name,
  required,
  disabled,
  id,
  ariaLabel,
  className,
  contentClassName,
  variant = 'default',
  hasMoreOptions = false,
  isLoadingMoreOptions = false,
  onLoadMoreOptions,
  loadMoreThreshold = 24,
}: CustomSelectProps<T>) {
  const { i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'

  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue)
  const isControlled = value !== undefined
  const selectedValue = isControlled ? value : internalValue
  const selectedValueKey =
    selectedValue === undefined || selectedValue === null
      ? undefined
      : String(selectedValue)
  const hasMountedRef = useRef(false)

  const effectiveValue = selectedValueKey ?? ''

  useEffect(() => {
    hasMountedRef.current = true
  }, [])

  const handleValueChange = (nextValue: string) => {
    if (!hasMountedRef.current && nextValue === '' && selectedValueKey) {
      return
    }

    const matchedOption = options.find((option) => String(option.value) === nextValue)
    const typedValue = (matchedOption?.value ?? (nextValue as unknown as T))

    if (!isControlled) {
      setInternalValue(typedValue)
    }

    onValueChange?.(typedValue)
  }

  const handleViewportScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!hasMoreOptions || isLoadingMoreOptions || !onLoadMoreOptions) {
        return
      }

      const viewport = event.currentTarget
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight

      if (distanceFromBottom <= loadMoreThreshold) {
        onLoadMoreOptions()
      }
    },
    [hasMoreOptions, isLoadingMoreOptions, loadMoreThreshold, onLoadMoreOptions]
  )

  return (
    <>
      <Select
        dir={isRtl ? 'rtl' : 'ltr'}
        value={effectiveValue}
        onValueChange={handleValueChange}
        required={required}
        disabled={disabled}
      >
        <div className="group/custom-select relative w-full min-w-0">
          {icon ? (
            <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground/75 transition-colors group-focus-within/custom-select:text-primary [inset-inline-start:0.9rem] [&_svg]:size-4">
              {icon}
            </span>
          ) : null}

          <SelectTrigger
            size="none"
            id={id}
            aria-label={ariaLabel}
            className={cn(
              variant === 'filter' ? FILTER_TRIGGER_CLASS : DEFAULT_TRIGGER_CLASS,
              icon && 'ps-11',
              '[&_[data-slot=select-value]]:flex-1 [&_[data-slot=select-value]]:text-start',
              className
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
        </div>

        <SelectContent
          position="popper"
          align={isRtl ? 'end' : 'start'}
          sideOffset={8}
          viewportProps={{
            onScroll: handleViewportScroll,
          }}
          className={cn(
            'z-[1000] w-[var(--radix-select-trigger-width)] rounded-xl border border-primary/10 bg-popover p-1 text-foreground shadow-[0_20px_60px_rgba(45,27,90,0.18)] ring-0 [&_[data-slot=select-scroll-up-button]]:bg-popover [&_[data-slot=select-scroll-down-button]]:bg-popover',
            contentClassName
          )}
        >
          {options.filter((option) => option.value !== null && option.value !== undefined).map((option) => (
            <SelectItem
              key={String(option.value)}
              value={String(option.value)}
              disabled={option.disabled}
              className="min-h-10 rounded-lg px-3 text-start text-sm"
            >
              {displayLabel(option.label, option.value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {name ? <input type="hidden" name={name} value={effectiveValue ?? ''} /> : null}
    </>
  )
}
