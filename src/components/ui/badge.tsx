import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

export type BadgeColor =
  | "default"
  | "primary"
  | "blue"
  | "fuchsia"
  | "amber"
  | "slate"
  | "emerald"
  | "rose"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      color: {
        default: "",
        primary: "",
        blue: "",
        fuchsia: "",
        amber: "",
        slate: "",
        emerald: "",
        rose: "",
      },
    },
    compoundVariants: [
      {
        variant: "outline",
        color: "primary",
        className: "border-primary/25 bg-primary/8 text-primary",
      },
      {
        variant: "outline",
        color: "blue",
        className: "border-transparent bg-blue-100 text-blue-700 ring-1 ring-blue-200",
      },
      {
        variant: "outline",
        color: "fuchsia",
        className: "border-transparent bg-fuchsia-100 text-fuchsia-700 ring-1 ring-fuchsia-200",
      },
      {
        variant: "outline",
        color: "amber",
        className: "border-transparent bg-amber-100 text-amber-700 ring-1 ring-amber-200",
      },
      {
        variant: "outline",
        color: "slate",
        className: "border-transparent bg-slate-100 text-slate-700 ring-1 ring-slate-200",
      },
      {
        variant: "outline",
        color: "emerald",
        className: "border-transparent bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
      },
      {
        variant: "outline",
        color: "rose",
        className: "border-transparent bg-rose-100 text-rose-700 ring-1 ring-rose-200",
      },
    ],
    defaultVariants: {
      variant: "default",
      color: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  color = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-color={color}
      className={cn(badgeVariants({ variant, color }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
