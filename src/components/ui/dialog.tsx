"use client"

/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

const dialogMotionTransition = {
  duration: 0.16,
  ease: [0.2, 0.8, 0.2, 1],
} as const

const DialogMotionContext = React.createContext({ open: false })
const DialogPortalContainerContext = React.createContext<HTMLElement | null>(null)

function useDialogMotion() {
  return React.useContext(DialogMotionContext)
}

function useDialogPortalContainer() {
  return React.useContext(DialogPortalContainerContext)
}

function Dialog({
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(Boolean(defaultOpen))
  const isControlled = controlledOpen !== undefined
  const open = controlledOpen ?? uncontrolledOpen

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen)
      }

      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )
  const rootControlProps = isControlled ? {} : { defaultOpen }

  return (
    <DialogMotionContext.Provider value={{ open }}>
      <DialogPrimitive.Root
        data-slot="dialog"
        open={open}
        {...rootControlProps}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </DialogMotionContext.Provider>
  )
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      forceMount
      asChild
      {...props}
    >
      <motion.div
        className={cn("fixed inset-0 isolate z-50 bg-black/20", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={dialogMotionTransition}
      />
    </DialogPrimitive.Overlay>
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const { open } = useDialogMotion()
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null)

  return (
    <DialogPortal forceMount>
      <AnimatePresence initial={false}>
        {open ? (
          <React.Fragment key="dialog-motion">
            <DialogOverlay key="dialog-overlay" />
            <DialogPrimitive.Content
              data-slot="dialog-content"
              forceMount
              asChild
              {...props}
            >
              <motion.div
                ref={setPortalContainer}
                className={cn(
                  "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-md border border-border bg-popover p-4 text-sm text-popover-foreground outline-none sm:max-w-5xl",
                  className
                )}
                initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 8px)", scale: 0.985 }}
                animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
                exit={{ opacity: 0, x: "-50%", y: "calc(-50% + 6px)", scale: 0.99 }}
                transition={dialogMotionTransition}
              >
                <DialogPortalContainerContext.Provider value={portalContainer}>
                  {children}
                  {showCloseButton && (
                    <DialogPrimitive.Close data-slot="dialog-close" asChild>
                      <Button
                        variant="ghost"
                        className="absolute top-2 end-2"
                        size="icon-sm"
                      >
                        <XIcon />
                        <span className="sr-only">Close</span>
                      </Button>
                    </DialogPrimitive.Close>
                  )}
                </DialogPortalContainerContext.Provider>
              </motion.div>
            </DialogPrimitive.Content>
          </React.Fragment>
        ) : null}
      </AnimatePresence>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-md border-t bg-muted/35 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  useDialogPortalContainer,
}
