import * as React from 'react'

import { cn } from '@/lib/utils'

type FormGridProps = React.ComponentPropsWithoutRef<'div'> & {
  columns?: 1 | 2 | 3 | 4
}

type FormFieldProps = React.ComponentPropsWithoutRef<'div'> & {
  span?: 1 | 2 | 3 | 4 | 'full'
}

const columnClasses: Record<NonNullable<FormGridProps['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
}

const spanClasses: Record<NonNullable<FormFieldProps['span']>, string> = {
  1: 'col-span-1',
  2: 'md:col-span-2',
  3: 'xl:col-span-3',
  4: 'xl:col-span-4',
  full: 'col-span-full',
}

export function FormGrid({ columns = 2, className, ...props }: FormGridProps) {
  return (
    <div
      data-slot="form-grid"
      className={cn('grid w-full gap-4 lg:gap-5', columnClasses[columns], className)}
      {...props}
    />
  )
}

export function FormField({ span = 1, className, ...props }: FormFieldProps) {
  return (
    <div
      data-slot="form-field"
      className={cn('min-w-0 space-y-2', spanClasses[span], className)}
      {...props}
    />
  )
}

export function FormActions({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="form-actions"
      className={cn(
        'col-span-full flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  )
}
