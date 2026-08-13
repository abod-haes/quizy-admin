import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid w-full gap-1 rounded-2xl border px-4 py-3 text-start text-sm shadow-sm has-data-[slot=alert-action]:pe-16 has-[>svg]:grid-cols-[auto_minmax(0,1fr)] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:mt-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-primary/10 bg-card text-card-foreground",
        info: "border-blue-200/80 bg-blue-50/80 text-blue-900 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100",
        success: "border-emerald-200/80 bg-emerald-50/80 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-100",
        warning: "border-amber-200/80 bg-amber-50/80 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100",
        destructive: "border-destructive/20 bg-destructive/5 text-destructive dark:bg-destructive/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("min-w-0 font-heading font-semibold leading-5 group-has-[>svg]/alert:col-start-2", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("min-w-0 text-sm leading-6 text-current/75 group-has-[>svg]/alert:col-start-2 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-3", className)}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-action" className={cn("absolute top-3 end-3", className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
