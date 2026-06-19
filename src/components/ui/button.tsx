import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap border border-transparent font-medium leading-none transition-[background-color,border-color,color,opacity] duration-150 outline-none select-none focus-visible:border-primary/45 focus-visible:ring-1 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/92 active:bg-primary/95 aria-expanded:bg-primary/95 data-[state=open]:bg-primary/95",
        outline:
          "border-border bg-card text-foreground hover:border-input hover:bg-muted/45 active:bg-muted/60 aria-expanded:border-primary/35 aria-expanded:bg-muted/60 data-[state=open]:border-primary/35 data-[state=open]:bg-muted/60",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/85 active:bg-secondary aria-expanded:bg-secondary data-[state=open]:bg-secondary",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-muted/75 active:bg-muted aria-expanded:bg-muted data-[state=open]:bg-muted",
        destructive:
          "border-transparent bg-destructive text-primary-foreground hover:bg-destructive/90 active:bg-destructive/95 aria-expanded:bg-destructive/95 data-[state=open]:bg-destructive/95 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        link:
          "border-transparent bg-transparent text-primary hover:underline active:opacity-85 underline-offset-4 focus-visible:border-transparent focus-visible:ring-0",
      },
      size: {
        default: "h-10 gap-2 rounded-md px-4 text-sm",
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1.5 rounded-md px-2.5 text-xs",
        lg: "h-11 gap-2 rounded-md px-5 text-sm",
        icon: "size-10 rounded-md p-0",
        "icon-xs": "size-6 rounded-md p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-md p-0",
        "icon-lg": "size-11 rounded-md p-0",
      },
    },
    compoundVariants: [
      {
        variant: "link",
        size: "default",
        className: "h-auto rounded-none p-0 shadow-none",
      },
      {
        variant: "link",
        size: "xs",
        className: "h-auto rounded-none p-0 shadow-none text-xs",
      },
      {
        variant: "link",
        size: "sm",
        className: "h-auto rounded-none p-0 shadow-none text-xs",
      },
      {
        variant: "link",
        size: "lg",
        className: "h-auto rounded-none p-0 shadow-none text-sm",
      },
      {
        variant: "link",
        size: "icon",
        className: "h-auto w-auto rounded-none p-0 shadow-none",
      },
      {
        variant: "link",
        size: "icon-xs",
        className: "h-auto w-auto rounded-none p-0 shadow-none",
      },
      {
        variant: "link",
        size: "icon-sm",
        className: "h-auto w-auto rounded-none p-0 shadow-none",
      },
      {
        variant: "link",
        size: "icon-lg",
        className: "h-auto w-auto rounded-none p-0 shadow-none",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type NativeButtonProps = Omit<React.ComponentPropsWithoutRef<"button">, "className">
type NativeAnchorProps = Omit<React.ComponentPropsWithoutRef<"a">, "className" | "href">

type ButtonProps = VariantProps<typeof buttonVariants> & {
  asChild?: boolean
  className?: string
  icon?: React.ReactNode
  iconPosition?: "start" | "end"
  loading?: boolean
} & (
  | ({ href: string } & NativeAnchorProps)
  | ({ href?: undefined } & NativeButtonProps)
)

const Button = React.forwardRef<HTMLElement, ButtonProps>(function Button(
  {
    className,
    variant = "default",
    size = "default",
    asChild = false,
    icon,
    iconPosition = "start",
    loading = false,
    href,
    type,
    children,
    ...props
  },
  ref
) {
  const spinner = (
    <svg
      aria-hidden="true"
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" className="opacity-25" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )

  const content = (
    <>
      {loading ? <span data-slot="button-spinner">{spinner}</span> : null}
      {!loading && icon && iconPosition === "start" ? <span data-slot="button-icon-start">{icon}</span> : null}
      {children}
      {!loading && icon && iconPosition === "end" ? <span data-slot="button-icon-end">{icon}</span> : null}
    </>
  )

  if (asChild) {
    return (
      <Slot.Root
        ref={ref as React.Ref<HTMLElement>}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        data-loading={loading ? "true" : undefined}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Slot.Root>
    )
  }

  if (href) {
    const anchorProps = props as NativeAnchorProps
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        data-loading={loading ? "true" : undefined}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        href={loading ? undefined : href}
        className={cn(buttonVariants({ variant, size, className }))}
        {...anchorProps}
        onClick={(event) => {
          if (loading) {
            event.preventDefault()
            return
          }
          anchorProps.onClick?.(event)
        }}
      >
        {content}
      </a>
    )
  }

  const buttonType =
    type === "submit" || type === "reset" || type === "button"
      ? type
      : "button"

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "true" : undefined}
      aria-busy={loading || undefined}
      type={buttonType}
      className={cn(buttonVariants({ variant, size, className }))}
      {...(props as NativeButtonProps)}
      disabled={loading || (props as NativeButtonProps).disabled}
    >
      {content}
    </button>
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
