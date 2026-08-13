import { CustomMultiSelect, type CustomMultiSelectOption } from '@/components/ui/custom-multi-select'

export type MultiSelectOption = CustomMultiSelectOption<string>

type MultiSelectProps = {
  values: string[]
  options: MultiSelectOption[]
  onValuesChange: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  ariaLabel?: string
  className?: string
}

export function MultiSelect({
  values,
  options,
  onValuesChange,
  placeholder,
  disabled,
  id,
  ariaLabel,
  className,
}: MultiSelectProps) {
  return (
    <CustomMultiSelect
      value={values}
      options={options}
      onValueChange={onValuesChange}
      placeholder={placeholder}
      disabled={disabled}
      id={id}
      ariaLabel={ariaLabel}
      className={className}
    />
  )
}
