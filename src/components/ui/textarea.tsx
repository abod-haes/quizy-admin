import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base text-foreground shadow-sm outline-none transition-[color,background-color,border-color,box-shadow] duration-150 placeholder:text-muted-foreground hover:border-primary/25 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-[3px] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
