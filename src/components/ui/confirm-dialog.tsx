import { CheckCircle2, Info, LoaderCircle, Trash2, TriangleAlert } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const CONFIRM_TYPE_STYLES = {
  destructive: {
    defaultConfirmVariant: "destructive" as const,
    accentBarClassName: "bg-destructive/70",
    iconWrapperClassName:
      "border-destructive/25 bg-card text-destructive ring-1 ring-destructive/10",
    icon: <Trash2 />,
  },
  warning: {
    defaultConfirmVariant: "default" as const,
    accentBarClassName: "bg-amber-500/70",
    iconWrapperClassName:
      "border-amber-500/25 bg-card text-amber-700 ring-1 ring-amber-500/10",
    icon: <TriangleAlert />,
  },
  success: {
    defaultConfirmVariant: "default" as const,
    accentBarClassName: "bg-emerald-500/70",
    iconWrapperClassName:
      "border-emerald-500/25 bg-card text-emerald-700 ring-1 ring-emerald-500/10",
    icon: <CheckCircle2 />,
  },
  info: {
    defaultConfirmVariant: "default" as const,
    accentBarClassName: "bg-primary/70",
    iconWrapperClassName:
      "border-primary/25 bg-card text-primary ring-1 ring-primary/10",
    icon: <Info />,
  },
} as const

type ConfirmDialogProps = {
  type?: "destructive" | "warning" | "success" | "info"
  title: ReactNode
  description?: ReactNode
  trigger?: ReactNode
  icon?: ReactNode
  showTypeIcon?: boolean
  confirmLabel?: ReactNode
  confirmingLabel?: ReactNode
  cancelLabel?: ReactNode
  confirmVariant?: React.ComponentProps<typeof Button>["variant"]
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onConfirm?: () => void | Promise<void>
  closeOnConfirm?: boolean
  contentClassName?: string
  cancelButtonClassName?: string
  confirmButtonClassName?: string
}

export function ConfirmDialog({
  type = "destructive",
  title,
  description,
  trigger,
  icon,
  showTypeIcon = true,
  confirmLabel = "Confirm",
  confirmingLabel = "Processing...",
  cancelLabel = "Cancel",
  confirmVariant,
  open,
  defaultOpen = false,
  onOpenChange,
  onConfirm,
  closeOnConfirm = true,
  contentClassName,
  cancelButtonClassName,
  confirmButtonClassName,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [isConfirming, setIsConfirming] = useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen
  const resolvedTypeStyles = CONFIRM_TYPE_STYLES[type]

  const resolvedConfirmVariant = useMemo(() => {
    if (confirmVariant) {
      return confirmVariant
    }

    return resolvedTypeStyles.defaultConfirmVariant
  }, [confirmVariant, resolvedTypeStyles.defaultConfirmVariant])

  const iconNode = useMemo(() => {
    if (icon) {
      return icon
    }
    return resolvedTypeStyles.icon
  }, [icon, resolvedTypeStyles.icon])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }

    if (!nextOpen) {
      setIsConfirming(false)
    }

    onOpenChange?.(nextOpen)
  }

  const handleConfirm = async () => {
    try {
      setIsConfirming(true)
      await onConfirm?.()

      if (closeOnConfirm) {
        handleOpenChange(false)
      }
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (isConfirming) {
            event.preventDefault()
          }
        }}
        onPointerDownOutside={(event) => {
          if (isConfirming) {
            event.preventDefault()
          }
        }}
        className={cn(
          "overflow-visible rounded-2xl border border-border bg-card p-0 shadow-2xl sm:max-w-md",
          contentClassName
        )}
      >
        <div aria-hidden className={cn("h-1 w-full rounded-t-2xl", resolvedTypeStyles.accentBarClassName)} />

        <DialogHeader className="items-center gap-0 px-6 pb-0 pt-6 text-center">
          {showTypeIcon ? (
            <span
              className={cn(
                "mx-auto mb-3 flex size-14 items-center justify-center rounded-full border shadow-sm [&_svg]:size-6",
                resolvedTypeStyles.iconWrapperClassName
              )}
              aria-hidden
            >
              {iconNode}
            </span>
          ) : null}
          <DialogTitle className="text-lg font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="mt-2 max-w-[48ch] text-sm leading-6 text-muted-foreground">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <DialogFooter className="mx-0 mb-0 mt-6 gap-2 border-t border-border bg-muted/15 px-6 py-4 sm:justify-center sm:gap-2">
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isConfirming}
            className={cn(
              "w-full rounded-lg sm:w-auto sm:min-w-32",
              cancelButtonClassName
            )}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="lg"
            variant={resolvedConfirmVariant}
            onClick={() => void handleConfirm()}
            disabled={isConfirming}
            className={cn(
              "w-full rounded-lg sm:w-auto sm:min-w-32",
              confirmButtonClassName
            )}
          >
            {isConfirming ? (
              <span className="inline-flex items-center gap-1.5">
                <LoaderCircle className="size-4 animate-spin" />
                {confirmingLabel}
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
