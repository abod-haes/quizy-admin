import { type HTMLInputTypeAttribute, type ReactNode } from 'react'
import { format } from 'date-fns'

import { CustomSelect, type CustomSelectOption } from '@/components/ui/custom-select'
import { DatePicker } from '@/components/ui/date-picker'
import { FiltersDialog } from '@/components/ui/filters-dialog'
import { Input } from '@/components/ui/input'

type EntityFilterInputField<TFieldKey extends string> = {
  key: TFieldKey
  type: 'input'
  label: ReactNode
  inputType?: HTMLInputTypeAttribute
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
  startIcon?: ReactNode
}

type EntityFilterSelectField<TFieldKey extends string> = {
  key: TFieldKey
  type: 'select'
  label: ReactNode
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
  options: CustomSelectOption<string>[]
  mapOnChange?: (nextValue: string) => string
}

type EntityFilterDateField<TFieldKey extends string> = {
  key: TFieldKey
  type: 'date'
  label: ReactNode
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
}

export type EntityFilterField<TFieldKey extends string> =
  | EntityFilterInputField<TFieldKey>
  | EntityFilterDateField<TFieldKey>
  | EntityFilterSelectField<TFieldKey>

type EntityFiltersDialogProps<TFieldKey extends string> = {
  fields: EntityFilterField<TFieldKey>[]
  values: Record<TFieldKey, string>
  onValueChange: (key: TFieldKey, nextValue: string) => void
  triggerLabel: ReactNode
  title?: ReactNode
  description?: ReactNode
  activeFiltersCount?: number
  applyLabel?: ReactNode
  resetLabel?: ReactNode
  open?: boolean
  defaultOpen?: boolean
  closeOnApply?: boolean
  onOpenChange?: (open: boolean) => void
  onApply?: () => void
  onReset?: () => void
  triggerClassName?: string
  contentClassName?: string
  triggerVariant?: 'default' | 'filter'
}

export function EntityFiltersDialog<TFieldKey extends string>({
  fields,
  values,
  onValueChange,
  triggerLabel,
  title,
  description,
  activeFiltersCount,
  applyLabel,
  resetLabel,
  open,
  defaultOpen,
  closeOnApply,
  onOpenChange,
  onApply,
  onReset,
  triggerClassName,
  contentClassName,
  triggerVariant,
}: EntityFiltersDialogProps<TFieldKey>) {
  const toDateValue = (value: string): Date | undefined => {
    const normalized = value.trim()
    if (!normalized) {
      return undefined
    }

    const parsed = new Date(`${normalized}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) {
      return undefined
    }

    return parsed
  }

  const toDateString = (value: Date | undefined): string => {
    if (!value) {
      return ''
    }

    return format(value, 'yyyy-MM-dd')
  }

  return (
    <FiltersDialog
      triggerLabel={triggerLabel}
      title={title}
      description={description}
      activeFiltersCount={activeFiltersCount}
      applyLabel={applyLabel}
      resetLabel={resetLabel}
      open={open}
      defaultOpen={defaultOpen}
      closeOnApply={closeOnApply}
      onOpenChange={onOpenChange}
      onApply={onApply}
      onReset={onReset}
      triggerClassName={triggerClassName}
      contentClassName={contentClassName}
      triggerVariant={triggerVariant}
    >
      {fields.map((field) => {
        const key = String(field.key)

        return (
          <div key={key} className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{field.label}</p>

            {field.type === 'input' ? (
              <Input
                type={field.inputType ?? 'text'}
                value={values[field.key]}
                onChange={(event) => {
                  onValueChange(field.key, event.target.value)
                }}
                placeholder={field.placeholder}
                aria-label={field.ariaLabel}
                disabled={field.disabled}
                startIcon={field.startIcon}
                variant="filter"
              />
            ) : field.type === 'date' ? (
              <DatePicker
                value={toDateValue(values[field.key])}
                onChange={(nextValue) => {
                  onValueChange(field.key, toDateString(nextValue))
                }}
                placeholder={field.placeholder}
                ariaLabel={field.ariaLabel}
                disabled={field.disabled}
                displayFormat="yyyy-MM-dd"
                className="h-10 rounded-md border border-input bg-card px-3 text-sm"
              />
            ) : (
              <CustomSelect
                value={values[field.key]}
                onValueChange={(nextValue) => {
                  const normalizedValue = field.mapOnChange?.(nextValue) ?? nextValue
                  onValueChange(field.key, normalizedValue)
                }}
                options={field.options}
                placeholder={field.placeholder}
                ariaLabel={field.ariaLabel}
                disabled={field.disabled}
                variant="filter"
              />
            )}
          </div>
        )
      })}
    </FiltersDialog>
  )
}
