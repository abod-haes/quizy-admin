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
    accentBarClassName: "bg-destructive/80",
    iconWrapperClassName:
      "bg-destructive/8 text-destructive ring-1 ring-inset ring-destructive/12",
    icon: <Trash2 />,
  },
  warning: {
    defaultConfirmVariant: "default" as const,
    accentBarClassName: "bg-amber-500/80",
    iconWrapperClassName:
      "bg-amber-500/8 text-amber-700 ring-1 ring-inset ring-amber-500/12",
    icon: <TriangleAlert />,
  },
  success: {
    defaultConfirmVariant: "default" as const,
    accentBarClassName: "bg-emerald-500/80",
    iconWrapperClassName:
      "bg-emerald-500/8 text-emerald-700 ring-1 ring-inset ring-emerald-500/12",
    icon: <CheckCircle2 />,
  },
  info: {
    defaultConfirmVariant: "default" as const,
    accentBarClassName: "bg-primary/80",
    iconWrapperClassName:
      "bg-primary/8 text-primary ring-1 ring-inset ring-primary/12",
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
        data-confirm-dialog="true"
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
          "overflow-visible rounded-[1.25rem] border border-primary/5 bg-card p-0 shadow-[0_16px_48px_rgba(45,27,90,0.14)] sm:max-w-sm",
          contentClassName
        )}
      >
        <div aria-hidden className={cn("h-1 w-full rounded-t-[1.25rem]", resolvedTypeStyles.accentBarClassName)} />

        <DialogHeader className="items-center gap-0 px-5 pb-0 pt-5 text-center">
          {showTypeIcon ? (
            <span
              className={cn(
                "mx-auto mb-3 flex size-11 items-center justify-center rounded-full [&_svg]:size-5",
                resolvedTypeStyles.iconWrapperClassName
              )}
              aria-hidden
            >
              {iconNode}
            </span>
          ) : null}
          <DialogTitle className="text-base font-bold leading-tight tracking-tight text-foreground">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="mt-1.5 max-w-[38ch] text-xs leading-5 text-muted-foreground sm:text-sm">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <DialogFooter className="mx-0 mb-0 mt-4 gap-2 border-t border-border/60 bg-muted/10 px-5 py-3.5 sm:justify-center sm:gap-2">
          <Button
            type="button"
            size="default"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isConfirming}
            className={cn(
              "w-full sm:w-auto sm:min-w-28",
              cancelButtonClassName
            )}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="default"
            variant={resolvedConfirmVariant}
            onClick={() => void handleConfirm()}
            disabled={isConfirming}
            className={cn(
              "w-full sm:w-auto sm:min-w-28",
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
