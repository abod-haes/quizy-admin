import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { SHARED_ICON_OPTIONS, SHARED_ICON_BY_NAME } from '@/shared/constants/icon-options'

type IconSelectProps = {
  value?: string | null
  onValueChange: (value: string) => void
  id?: string
  placeholder?: string
  disabled?: boolean
}

export function IconSelect({ value, onValueChange, id, placeholder, disabled }: IconSelectProps) {
  const { t } = useTranslation('section-items')
  const selectedName = String(value ?? '').trim()
  const SelectedIcon = SHARED_ICON_BY_NAME[selectedName] ?? SHARED_ICON_BY_NAME.unknown

  const options = useMemo(() => SHARED_ICON_OPTIONS, [])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-10 w-full justify-between rounded-md border-input bg-card px-3 text-sm font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <SelectedIcon className="size-4 text-muted-foreground" />
            <span className={cn('truncate', !selectedName && 'text-muted-foreground')}>
              {selectedName || placeholder || t('form.fields.icon')}
            </span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[1000] w-[var(--radix-popover-trigger-width)] rounded-md p-1">
        <div className="max-h-72 overflow-y-auto">
          {options.map((option) => {
            const OptionIcon = option.icon
            const isSelected = option.name === selectedName
            return (
              <button
                key={option.name}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-sm px-2.5 py-2 text-sm hover:bg-muted/60',
                  isSelected && 'bg-muted'
                )}
                onClick={() => onValueChange(option.name)}
              >
                <span className="flex items-center gap-2">
                  <OptionIcon className="size-4 text-muted-foreground" />
                  <span>{option.name}</span>
                </span>
                {isSelected ? <Check className="size-4 text-primary" /> : null}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
