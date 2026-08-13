import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type FormSectionCardProps = {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function FormSectionCard({
  title,
  description,
  icon,
  children,
  className,
  contentClassName,
}: FormSectionCardProps) {
  return (
    <Card className={cn('w-full min-w-0 border border-border bg-card', className)}>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex min-w-0 items-start gap-2.5">
          {icon ? (
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-foreground [&_svg]:size-4"
              aria-hidden
            >
              {icon}
            </span>
          ) : null}

          <div className="min-w-0 flex-1 space-y-0.5">
            <CardTitle className="break-words text-base font-semibold">{title}</CardTitle>
            {description ? (
              <CardDescription className="break-words text-xs leading-5">{description}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          'grid min-w-0 grid-cols-1 gap-4 pt-5 md:grid-cols-2 xl:grid-cols-3',
          contentClassName
        )}
      >
        {children}
      </CardContent>
    </Card>
  )
}
