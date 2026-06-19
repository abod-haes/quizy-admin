import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

type FormFieldProps = {
  htmlFor?: string
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode
  className?: string
  labelClassName?: string
}

export function FormField({
  htmlFor,
  label,
  hint,
  error,
  children,
  className,
  labelClassName,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={htmlFor}
        className={cn(
          'text-xs font-semibold tracking-[0.01em] text-muted-foreground',
          error && 'text-destructive',
          labelClassName
        )}
      >
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-[11px] font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
