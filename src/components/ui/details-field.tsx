import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'

type DetailsFieldProps = {
  label: ReactNode
  value?: ReactNode
  fallback?: ReactNode
  isPhoneNumber?: boolean
  className?: string
  labelClassName?: string
  valueClassName?: string
}

function resolveValue(value: ReactNode | undefined, fallback: ReactNode) {
  if (value === null || value === undefined) {
    return fallback
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim()
    return normalizedValue || fallback
  }

  return value
}

function resolvePhoneDisplayValue(value: ReactNode | undefined, fallback: ReactNode) {
  if (typeof fallback !== 'string') {
    return resolveValue(value, fallback)
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return formatUiDisplayValue(value, {
      isPhoneNumber: true,
      fallback,
    })
  }

  return resolveValue(value, fallback)
}

export function DetailsField({
  label,
  value,
  fallback = '-',
  isPhoneNumber = false,
  className,
  labelClassName,
  valueClassName,
}: DetailsFieldProps) {
  const { i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'

  return (
    <div className={className}>
      <p className={cn('text-xs font-semibold text-muted-foreground', labelClassName)}>
        {label}
      </p>
      <p
        dir={isPhoneNumber ? 'ltr' : undefined}
        className={cn(
          'pt-1 text-sm leading-6 text-foreground',
          isPhoneNumber &&
            cn('[direction:ltr] [unicode-bidi:isolate]', isRtl ? 'text-right' : 'text-left'),
          valueClassName
        )}
      >
        {isPhoneNumber
          ? resolvePhoneDisplayValue(value, fallback)
          : resolveValue(value, fallback)}
      </p>
    </div>
  )
}
