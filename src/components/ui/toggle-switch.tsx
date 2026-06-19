import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type ToggleSwitchProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function ToggleSwitch({
  checked,
  onCheckedChange,
  className,
  disabled,
  ...props
}: ToggleSwitchProps) {
  return (
    <button
      {...props}
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onCheckedChange(!checked)
        }
      }}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent px-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-55',
        checked ? 'bg-primary' : 'bg-muted-foreground/25',
        className
      )}
    >
      <span
        className={cn(
          'size-4 rounded-full bg-white transition-transform duration-150',
          checked ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}
