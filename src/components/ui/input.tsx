import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  startIcon?: React.ReactNode
  variant?: 'default' | 'filter'
  numericWithComma?: boolean
}

const INPUT_BASE_CLASS =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground transition-[background-color,border-color] duration-150 placeholder:text-muted-foreground hover:border-muted-foreground/45 focus-visible:border-primary/55 focus-visible:ring-1 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20"

const DEFAULT_INPUT_CLASS = INPUT_BASE_CLASS
const FILTER_INPUT_CLASS = INPUT_BASE_CLASS

function Input({
  className,
  type,
  startIcon,
  variant = "default",
  numericWithComma = false,
  onChange,
  inputMode,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isPasswordType = type === 'password'
  const hasTrailingControl = isPasswordType
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
      className={cn(
        variant === "filter" ? FILTER_INPUT_CLASS : DEFAULT_INPUT_CLASS,
        className,
        startIcon && "[padding-inline-start:2.5rem]",
        hasTrailingControl && "[padding-inline-end:2.5rem]"
      )}
      {...props}
      onChange={handleChange}
    />
  )

  if (!startIcon && !hasTrailingControl) {
    return inputElement
  }

  return (
    <div className="group/input relative w-full">
      <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground/80 transition-colors group-focus-within/input:text-primary/80 [inset-inline-start:0.75rem] [&_svg]:size-4">
        {startIcon}
      </span>
      {hasTrailingControl ? (
        <button
          type="button"
          className="absolute top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 [inset-inline-end:0.7rem] [&_svg]:size-4"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </button>
      ) : null}

      {inputElement}
    </div>
  )
}

export { Input }
