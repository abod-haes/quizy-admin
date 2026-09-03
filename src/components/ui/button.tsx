import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap border font-semibold leading-none outline-none select-none transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-[var(--quizy-motion-fast)] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-[3px] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-[var(--quizy-control-shadow)] hover:bg-primary/92 hover:shadow-[var(--quizy-control-focus-shadow)] active:bg-primary/96 aria-expanded:bg-primary/95 data-[state=open]:bg-primary/95",
        outline:
          "border-input bg-[var(--quizy-surface-strong)] text-foreground shadow-[var(--quizy-control-shadow)] hover:border-primary/25 hover:bg-accent/45 active:bg-accent/60 aria-expanded:border-primary/30 aria-expanded:bg-accent/55 data-[state=open]:border-primary/30 data-[state=open]:bg-accent/55",
        secondary:
          "border-primary/10 bg-secondary text-secondary-foreground shadow-[var(--quizy-control-shadow)] hover:border-primary/20 hover:bg-secondary/85 active:bg-secondary aria-expanded:bg-secondary data-[state=open]:bg-secondary",
        ghost:
          "border-transparent bg-transparent text-foreground shadow-none hover:bg-muted/75 active:bg-muted aria-expanded:bg-muted data-[state=open]:bg-muted",
        destructive:
          "border-destructive bg-destructive text-primary-foreground shadow-[var(--quizy-control-shadow)] hover:bg-destructive/90 hover:shadow-[var(--quizy-control-focus-shadow)] active:bg-destructive/95 aria-expanded:bg-destructive/95 data-[state=open]:bg-destructive/95",
        link:
          "border-transparent bg-transparent text-primary shadow-none hover:underline active:opacity-85 underline-offset-4 focus-visible:border-transparent focus-visible:shadow-none",
      },
      size: {
        default:
          "h-[var(--quizy-control-height)] gap-2 rounded-[var(--quizy-control-radius)] px-[var(--quizy-control-padding-inline)] text-[length:var(--quizy-control-font-size)]",
        xs:
          "h-[var(--quizy-control-height-sm)] gap-1.5 rounded-[var(--quizy-control-radius)] px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm:
          "h-[var(--quizy-control-height)] gap-2 rounded-[var(--quizy-control-radius)] px-3.5 text-sm",
        lg:
          "h-[var(--quizy-control-height-lg)] gap-2 rounded-[var(--quizy-control-radius)] px-5 text-sm",
        icon:
          "size-[var(--quizy-control-height)] rounded-[var(--quizy-control-radius)] p-0",
        "icon-xs":
          "size-[var(--quizy-control-height-sm)] rounded-[var(--quizy-control-radius)] p-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm":
          "size-[var(--quizy-control-height-sm)] rounded-[var(--quizy-control-radius)] p-0",
        "icon-lg":
          "size-[var(--quizy-control-height-lg)] rounded-[var(--quizy-control-radius)] p-0",
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
        className: "h-auto rounded-none p-0 shadow-none text-sm",
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
