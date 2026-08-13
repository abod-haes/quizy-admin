import type { ReactNode } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
    <Card
      data-slot="form-section-card"
      className={cn('w-full min-w-0 border border-primary/10 bg-card', className)}
    >
      <CardHeader className="border-b border-primary/10 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary/8 text-primary [&_svg]:size-4"
              aria-hidden
            >
              {icon}
            </span>
          ) : null}

          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="break-words text-base font-semibold leading-6">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="max-w-3xl break-words text-xs leading-5 sm:text-sm">
                {description}
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          'grid min-w-0 grid-cols-1 gap-4 pt-5 sm:gap-5 md:grid-cols-2 xl:grid-cols-3',
          contentClassName
        )}
      >
        {children}
      </CardContent>
    </Card>
  )
}
