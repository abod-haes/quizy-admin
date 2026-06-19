import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { ToggleSwitch } from '@/components/ui/toggle-switch'

type FormToggleRowProps = {
  label: ReactNode
  description?: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function FormToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: FormToggleRowProps) {
  return (
    <div
      className={cn(
        'flex min-h-10 items-center justify-start gap-3 py-1.5',
        className
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>

      <ToggleSwitch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
