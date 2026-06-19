import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type EntityPageSkeletonProps = {
  mode?: 'view' | 'form'
}

export function EntityPageSkeleton({ mode = 'view' }: EntityPageSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="rounded-md border border-border bg-card lg:col-span-2">
        <CardContent className="space-y-4 p-4 md:p-5">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: mode === 'form' ? 8 : 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-md border border-border bg-card">
        <CardContent className="space-y-3 p-4 md:p-5">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: mode === 'form' ? 5 : 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
