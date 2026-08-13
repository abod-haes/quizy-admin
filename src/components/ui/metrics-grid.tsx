import { type ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type MetricCardItem = {
  id: string
  label: string
  value: string
  note?: string
  tone?: 'primary' | 'default'
  progress?: number
  avatars?: string[]
  icon?: ReactNode
}

type MetricsGridProps = {
  items: MetricCardItem[]
  className?: string
}

function AvatarStack({ avatars }: { avatars: string[] }) {
  return (
    <div className="flex min-w-0 items-center overflow-hidden">
      {avatars.map((avatar, index) => (
        <div
          key={`${avatar}-${index}`}
          className="-ms-2 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-card bg-slate-200 text-[0.58rem] font-bold text-slate-700 first:ms-0"
        >
          {avatar}
        </div>
      ))}
    </div>
  )
}

export function MetricsGrid({ items, className }: MetricsGridProps) {
  return (
    <section className={cn('grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3', className)}>
      {items.map((item) => {
        const isPrimary = item.tone === 'primary'

        return (
          <Card
            key={item.id}
            className={cn(
              'relative min-w-0 overflow-hidden',
              isPrimary
                ? 'bg-primary text-primary-foreground ring-primary/30'
                : 'ring-1 ring-foreground/10'
            )}
          >
            <CardContent className={cn('min-w-0', item.progress ? 'space-y-3' : 'space-y-2')}>
              <p
                className={cn(
                  'break-words text-[0.65rem] font-semibold tracking-[0.14em] uppercase',
                  isPrimary ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </p>

              <p
                className={cn(
                  'break-words font-[var(--font-sans)] text-3xl font-black leading-none sm:text-4xl',
                  isPrimary ? 'text-primary-foreground' : 'text-foreground'
                )}
              >
                {item.value}
              </p>

              {typeof item.progress === 'number' ? (
                <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.progress}%` }} />
                </div>
              ) : null}

              {item.avatars && item.avatars.length > 0 ? <AvatarStack avatars={item.avatars} /> : null}

              {item.note ? (
                <p
                  className={cn(
                    'break-words text-xs font-medium leading-5',
                    isPrimary ? 'text-primary-foreground/85' : 'text-muted-foreground'
                  )}
                >
                  {item.note}
                </p>
              ) : null}
            </CardContent>

            {item.icon ? (
              <span className="pointer-events-none absolute bottom-2 end-3 text-primary-foreground/12 [&_svg]:size-10 sm:[&_svg]:size-12">
                {item.icon}
              </span>
            ) : null}
          </Card>
        )
      })}
    </section>
  )
}
