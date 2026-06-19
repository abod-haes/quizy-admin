import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type TruncatedTextProps = {
  text: string
  maxLength?: number
  className?: string
  title?: string
  fallback?: ReactNode
}

export function TruncatedText({
  text,
  maxLength = 80,
  className,
  title,
  fallback = '-',
}: TruncatedTextProps) {
  const normalized = String(text ?? '').trim()

  if (!normalized) {
    return <>{fallback}</>
  }

  const needsTruncate = normalized.length > maxLength
  const display = needsTruncate ? `${normalized.slice(0, maxLength).trimEnd()}...` : normalized

  return (
    <span className={cn('inline-block max-w-full overflow-hidden', className)} title={title ?? normalized}>
      {display}
    </span>
  )
}
