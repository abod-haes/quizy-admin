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
  'h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none transition-[background-color,border-color] duration-150 hover:border-muted-foreground/45 focus-visible:border-primary/55 focus-visible:ring-1 focus-visible:ring-primary/20 data-[state=open]:border-primary/55 data-[state=open]:ring-1 data-[state=open]:ring-primary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20'

const DEFAULT_TRIGGER_CLASS = SELECT_TRIGGER_BASE_CLASS
const FILTER_TRIGGER_CLASS = SELECT_TRIGGER_BASE_CLASS

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

  // Keep the controlled value stable even before options load. This avoids
  // losing initial edit values in some form integrations.
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
        <div className="group/custom-select relative w-full">
          {icon ? (
            <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground/80 transition-colors group-focus-within/custom-select:text-primary/80 [inset-inline-start:0.75rem] [&_svg]:size-4">
              {icon}
            </span>
          ) : null}

          <SelectTrigger
            size="none"
            id={id}
            aria-label={ariaLabel}
            className={cn(
              variant === 'filter' ? FILTER_TRIGGER_CLASS : DEFAULT_TRIGGER_CLASS,
              icon && 'ps-10',
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
            'z-[1000] w-[var(--radix-select-trigger-width)] rounded-md border border-border bg-popover p-1 text-foreground ring-0 [&_[data-slot=select-scroll-up-button]]:bg-popover [&_[data-slot=select-scroll-down-button]]:bg-popover',
            contentClassName
          )}
        >
          {options.map((option) => (
            <SelectItem
              key={String(option.value)}
              value={String(option.value)}
              disabled={option.disabled}
              className="h-9 rounded-sm px-2.5 text-start text-sm"
            >
              {formatUiDisplayValue(option.label, {
                isPhoneNumber: looksLikePhoneText(option.label),
                stripIdTokens: true,
                fallback: option.label,
              })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {name ? <input type="hidden" name={name} value={effectiveValue ?? ''} /> : null}
    </>
  )
}
