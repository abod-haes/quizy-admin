import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[var(--quizy-control-radius)] border border-input bg-[var(--quizy-surface-strong)] px-[var(--quizy-control-padding-inline)] py-2.5 text-[length:var(--quizy-control-font-size)] font-medium text-foreground shadow-[var(--quizy-control-shadow)] outline-none transition-[color,background-color,border-color,box-shadow] duration-[var(--quizy-motion-fast)] placeholder:text-muted-foreground hover:border-primary/25 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-[3px]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
