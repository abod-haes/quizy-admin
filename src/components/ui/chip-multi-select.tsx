import { cn } from '@/lib/utils'

type ChipMultiSelectOption = {
  value: string
  label: string
}

type ChipMultiSelectProps = {
  value: string[]
  options: ChipMultiSelectOption[]
  onChange: (nextValue: string[]) => void
  addMoreLabel?: string
  className?: string
}

export function ChipMultiSelect({
  value,
  options,
  onChange,
  addMoreLabel,
  className,
}: ChipMultiSelectProps) {
  const handleToggle = (optionValue: string) => {
    const isSelected = value.includes(optionValue)

    if (isSelected) {
      onChange(value.filter((selectedValue) => selectedValue !== optionValue))
      return
    }

    onChange([...value, optionValue])
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {options.map((option) => {
        const isSelected = value.includes(option.value)

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            className={cn(
              'inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold transition-[background-color,border-color,color] duration-150',
              isSelected
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
            )}
            aria-pressed={isSelected}
          >
            {option.label}
          </button>
        )
      })}

      {addMoreLabel ? (
        <span className="inline-flex h-8 items-center px-1 text-xs text-muted-foreground">
          {addMoreLabel}
        </span>
      ) : null}
    </div>
  )
}
