import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  variant?: 'default' | 'filter'
  numericWithComma?: boolean
}

const INPUT_BASE_CLASS =
  "h-11 w-full rounded-xl border border-input bg-[var(--quizy-surface-strong)] px-3.5 text-sm font-medium text-foreground shadow-sm outline-none transition-[color,background-color,border-color,box-shadow] duration-150 placeholder:text-muted-foreground hover:border-primary/25 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-[3px]"

const DEFAULT_INPUT_CLASS = INPUT_BASE_CLASS
const FILTER_INPUT_CLASS = INPUT_BASE_CLASS

function Input({
  className,
  type,
  startIcon,
  endIcon,
  variant = "default",
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
      data-leading-icon={hasLeadingIcon ? '' : undefined}
      data-trailing-icon={hasTrailingControl ? '' : undefined}
      className={cn(
        variant === "filter" ? FILTER_INPUT_CLASS : DEFAULT_INPUT_CLASS,
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
          className="absolute top-1/2 -translate-y-1/2 rounded-xl p-1 text-muted-foreground/80 transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 [inset-inline-end:0.75rem] [&_svg]:size-4"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff /> : <Eye />}
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
