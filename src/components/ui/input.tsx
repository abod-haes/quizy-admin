import * as React from "react"

import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

type InputSize = 'sm' | 'md' | 'lg'

type InputProps = Omit<React.ComponentProps<"input">, 'size'> & {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  variant?: 'default' | 'filter'
  size?: InputSize
  numericWithComma?: boolean
}

const INPUT_BASE_CLASS =
  "w-full rounded-[var(--quizy-control-radius)] border border-input bg-[var(--quizy-surface-strong)] px-[var(--quizy-control-padding-inline)] font-medium text-foreground shadow-[var(--quizy-control-shadow)] outline-none transition-[color,background-color,border-color,box-shadow] duration-[var(--quizy-motion-fast)] placeholder:text-muted-foreground hover:border-primary/25 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-[3px]"

const INPUT_SIZE_CLASS: Record<InputSize, string> = {
  sm: 'h-[var(--quizy-control-height-sm)] px-3 text-xs',
  md: 'h-[var(--quizy-control-height)] text-[length:var(--quizy-control-font-size)]',
  lg: 'h-[var(--quizy-control-height-lg)] px-4 text-sm',
}

const DEFAULT_INPUT_CLASS = INPUT_BASE_CLASS
const FILTER_INPUT_CLASS = INPUT_BASE_CLASS

function Input({
  className,
  type,
  startIcon,
  endIcon,
  variant = "default",
  size = 'md',
  numericWithComma = false,
  onChange,
  inputMode,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isPasswordType = type === 'password'
  const hasLeadingIcon = Boolean(startIcon)
  const hasTrailingControl = isPasswordType || Boolean(endIcon)
  const passwordResolvedType = isPasswordType ? (showPassword ? 'text' : 'password') : type
  const resolvedType = numericWithComma ? 'text' : passwordResolvedType
  const resolvedInputMode = numericWithComma ? 'decimal' : inputMode

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (numericWithComma) {
        const sanitizedValue = event.target.value
          .replace(/[^\d.,،]/g, '')
          .replace(/،/g, ',')
        event.target.value = sanitizedValue
      }

      onChange?.(event)
    },
    [numericWithComma, onChange]
  )

  const inputElement = (
    <input
      type={resolvedType}
      inputMode={resolvedInputMode}
      data-slot="input"
      data-size={size}
      data-leading-icon={hasLeadingIcon ? '' : undefined}
      data-trailing-icon={hasTrailingControl ? '' : undefined}
      className={cn(
        variant === "filter" ? FILTER_INPUT_CLASS : DEFAULT_INPUT_CLASS,
        INPUT_SIZE_CLASS[size],
        className,
        hasLeadingIcon && "[padding-inline-start:2.75rem]",
        hasTrailingControl && "[padding-inline-end:2.75rem]"
      )}
      {...props}
      onChange={handleChange}
    />
  )

  if (!hasLeadingIcon && !hasTrailingControl) {
    return inputElement
  }

  return (
    <div className="group/input relative w-full">
      {hasLeadingIcon ? (
        <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground/80 transition-colors group-focus-within/input:text-primary/80 [inset-inline-start:0.9rem] [&_svg]:size-4">
          {startIcon}
        </span>
      ) : null}

      {isPasswordType ? (
        <button
          type="button"
          className="absolute top-1/2 -translate-y-1/2 rounded-[calc(var(--quizy-control-radius)-0.125rem)] p-1 text-muted-foreground/80 transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 [inset-inline-end:0.75rem] [&_svg]:size-4"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <Icon.hide /> : <Icon.view />}
        </button>
      ) : endIcon ? (
        <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground/80 [inset-inline-end:0.9rem] [&_svg]:size-4">
          {endIcon}
        </span>
      ) : null}

      {inputElement}
    </div>
  )
}

export { Input }
export type { InputProps, InputSize }
