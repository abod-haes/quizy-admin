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

const EMPTY_OPTION_KEY = '__quizy_empty_option__'
const SELECT_TRIGGER_BASE_CLASS =
  'h-[var(--quizy-control-height)] w-full min-w-0 rounded-[var(--quizy-control-radius)] border border-input bg-[var(--quizy-surface-strong)] px-[var(--quizy-control-padding-inline)] text-[length:var(--quizy-control-font-size)] font-medium text-foreground shadow-[var(--quizy-control-shadow)] outline-none transition-[color,background-color,border-color,box-shadow] duration-[var(--quizy-motion-fast)] hover:border-primary/25 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-[3px]'

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

function toRadixValue(value: string | number) {
  return String(value) === '' ? EMPTY_OPTION_KEY : String(value)
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
  const hasEmptyOption = options.some((option) => String(option.value) === '')

  const effectiveValue =
    selectedValueKey === undefined
      ? hasEmptyOption
        ? EMPTY_OPTION_KEY
        : ''
      : selectedValueKey === ''
        ? EMPTY_OPTION_KEY
        : selectedValueKey

  useEffect(() => {
    hasMountedRef.current = true
  }, [])

  const handleValueChange = (nextValue: string) => {
    if (!hasMountedRef.current && nextValue === '' && selectedValueKey) {
      return
    }

    const matchedOption = options.find((option) => toRadixValue(option.value) === nextValue)
    const typedValue = matchedOption?.value ?? (nextValue as unknown as T)

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
          viewportProps={{ onScroll: handleViewportScroll }}
          className={cn(
            'z-[1000] w-[var(--radix-select-trigger-width)] rounded-[var(--quizy-control-radius)] border border-primary/10 bg-popover p-1 text-foreground shadow-[var(--quizy-popup-shadow)] ring-0 [&_[data-slot=select-scroll-up-button]]:bg-popover [&_[data-slot=select-scroll-down-button]]:bg-popover',
            contentClassName
          )}
        >
          {options
            .filter((option) => option.value !== null && option.value !== undefined)
            .map((option) => {
              const radixValue = toRadixValue(option.value)
              return (
                <SelectItem
                  key={radixValue}
                  value={radixValue}
                  disabled={option.disabled}
                  className="min-h-10 rounded-[var(--quizy-control-radius)] px-3 text-start text-sm"
                >
                  {displayLabel(option.label, option.value)}
                </SelectItem>
              )
            })}
        </SelectContent>
      </Select>

      {name ? <input type="hidden" name={name} value={selectedValueKey ?? ''} /> : null}
    </>
  )
}
