import { ChevronDownIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  formatUiDisplayValue,
  looksLikePhoneText,
} from '@/shared/lib/display-format.helpers'

export type CustomMultiSelectOption<T extends string | number = string> = {
  label: string
  value: T
  disabled?: boolean
}

type CustomMultiSelectProps<T extends string | number = string> = {
  value?: T[]
  defaultValue?: T[]
  onValueChange?: (value: T[]) => void
  options: CustomMultiSelectOption<T>[]
  placeholder?: string
  disabled?: boolean
  id?: string
  ariaLabel?: string
  className?: string
}

const DEFAULT_TRIGGER_CLASS =
  'h-[var(--quizy-control-height)] w-full min-w-0 rounded-[var(--quizy-control-radius)] border border-input bg-[var(--quizy-surface-strong)] px-[var(--quizy-control-padding-inline)] text-[length:var(--quizy-control-font-size)] font-medium text-foreground shadow-[var(--quizy-control-shadow)] outline-none transition-[color,background-color,border-color,box-shadow] duration-[var(--quizy-motion-fast)] hover:border-primary/25 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-50'

function displayLabel(value: unknown, fallback: unknown): string {
  const label = typeof value === 'string' && value.trim() ? value : fallback
  const safeLabel = label === null || label === undefined ? '-' : String(label)

  return formatUiDisplayValue(safeLabel, {
    isPhoneNumber: looksLikePhoneText(safeLabel),
    stripIdTokens: true,
    fallback: safeLabel || '-',
  })
}

export function CustomMultiSelect<T extends string | number = string>({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder,
  disabled,
  id,
  ariaLabel,
  className,
}: CustomMultiSelectProps<T>) {
  const { i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const safeOptions = useMemo(
    () => options.filter((option) => option.value !== null && option.value !== undefined),
    [options]
  )
  const [internalValue, setInternalValue] = useState<T[]>(defaultValue ?? [])
  const isControlled = value !== undefined
  const selectedValues = isControlled ? value : internalValue

  const selectedKeys = useMemo(() => {
    return (selectedValues ?? []).map((selectedValue) => String(selectedValue))
  }, [selectedValues])

  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys])

  const setSelectedValues = (nextValue: T[]) => {
    if (!isControlled) {
      setInternalValue(nextValue)
    }

    onValueChange?.(nextValue)
  }

  const toggleOption = (option: CustomMultiSelectOption<T>) => {
    const optionValue = String(option.value)

    if (selectedKeySet.has(optionValue)) {
      setSelectedValues(
        (selectedValues ?? []).filter(
          (selectedValue) => String(selectedValue) !== optionValue
        )
      )
      return
    }

    setSelectedValues([...(selectedValues ?? []), option.value])
  }

  const triggerLabel = useMemo(() => {
    if (selectedKeys.length === 0) {
      return placeholder ?? ''
    }

    const labels = selectedKeys.map((selectedKey) => {
      const matchingOption = safeOptions.find(
        (option) => String(option.value) === selectedKey
      )
      return displayLabel(matchingOption?.label, selectedKey)
    })

    if (labels.length <= 2) {
      return labels.join(', ')
    }

    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
  }, [safeOptions, placeholder, selectedKeys])

  return (
    <DropdownMenu dir={isRtl ? 'rtl' : 'ltr'}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          aria-label={ariaLabel}
          className={cn(
            DEFAULT_TRIGGER_CLASS,
            'flex items-center justify-between gap-2',
            className
          )}
        >
          <span
            className={cn(
              'line-clamp-1 min-w-0 flex-1 text-start text-sm',
              selectedKeys.length > 0 ? 'text-foreground' : 'text-muted-foreground/75'
            )}
          >
            {triggerLabel || '-'}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {selectedKeys.length > 0 ? (
              <span className="inline-flex min-w-6 items-center justify-center rounded-[calc(var(--quizy-control-radius)-0.125rem)] bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                {selectedKeys.length}
              </span>
            ) : null}
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isRtl ? 'end' : 'start'}
        sideOffset={8}
        className="z-[1000] max-h-80 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-[var(--quizy-control-radius)] border border-primary/10 bg-popover p-1.5 text-foreground shadow-[var(--quizy-popup-shadow)] ring-0"
      >
        {safeOptions.length === 0 ? (
          <div className="px-3 py-2.5 text-sm text-muted-foreground">-</div>
        ) : null}

        {safeOptions.map((option) => {
          const optionValue = String(option.value)

          return (
            <DropdownMenuCheckboxItem
              key={optionValue}
              checked={selectedKeySet.has(optionValue)}
              disabled={option.disabled}
              onCheckedChange={() => toggleOption(option)}
              onSelect={(event) => event.preventDefault()}
              className="min-h-10 rounded-[calc(var(--quizy-control-radius)-0.125rem)] px-3 text-start text-sm text-foreground data-[state=checked]:bg-primary/10 data-[state=checked]:font-semibold data-[state=checked]:text-foreground"
            >
              {displayLabel(option.label, option.value)}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
