import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ToastPayload, ToastType } from '@/shared/lib/toast'

type ToastProps = {
  toast: ToastPayload
  onClose: (id: string) => void
}

const toastStyles: Record<ToastType, { border: string; iconBg: string; iconText: string; Icon: typeof CheckCircle2 }> = {
  success: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-600',
    Icon: CheckCircle2,
  },
  error: {
    border: 'border-l-destructive',
    iconBg: 'bg-destructive/10',
    iconText: 'text-destructive',
    Icon: AlertCircle,
  },
  info: {
    border: 'border-l-sky-500',
    iconBg: 'bg-sky-500/10',
    iconText: 'text-sky-600',
    Icon: Info,
  },
}

export function ToastComponent({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const exitTimeoutRef = useRef<number | null>(null)
  const styles = toastStyles[toast.type]
  const Icon = styles.Icon
  const duration = toast.duration ?? 5000

  const handleClose = useCallback(() => {
    setIsExiting(true)
    exitTimeoutRef.current = window.setTimeout(() => onClose(toast.id), 220)
  }, [onClose, toast.id])

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 10)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (duration > 0) timeoutRef.current = window.setTimeout(handleClose, duration)
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [duration, handleClose])

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) window.clearTimeout(exitTimeoutRef.current)
    }
  }, [])

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto relative flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-border border-l-4 bg-popover px-4 py-3 text-popover-foreground shadow-xl transition-all duration-200',
        styles.border,
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      )}
    >
      <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', styles.iconBg)}>
        <Icon className={cn('size-5', styles.iconText)} />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold leading-5 text-foreground">{toast.message}</p>
        {toast.description ? <p className="text-xs leading-5 text-muted-foreground">{toast.description}</p> : null}
      </div>
      <button
        type="button"
        onClick={handleClose}
        className="-me-1 -mt-1 shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Close toast"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
