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
    <Card className={cn('rounded-md border border-border bg-card', className)}>
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          {icon ? (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground [&_svg]:size-4" aria-hidden>
              {icon}
            </span>
          ) : null}

          <div className="min-w-0 space-y-0.5">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-xs">{description}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn('grid gap-4 pt-5 lg:grid-cols-3 md:grid-cols-2', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
