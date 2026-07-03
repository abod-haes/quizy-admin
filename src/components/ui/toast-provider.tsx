/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { ToastComponent } from '@/components/ui/toast'
import { subscribeToToasts, toast, type ToastOptions, type ToastPayload, type ToastType } from '@/shared/lib/toast'
import { cn } from '@/lib/utils'

type ToastContextValue = {
  showToast: (type: ToastType, message: string, options?: ToastOptions | number) => void
  success: (message: string, options?: ToastOptions | number) => void
  error: (message: string, options?: ToastOptions | number) => void
  info: (message: string, options?: ToastOptions | number) => void
}

type ToastProviderProps = PropsWithChildren<{
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}>

const ToastContext = createContext<ToastContextValue | null>(null)

const positionClasses: Record<NonNullable<ToastProviderProps['position']>, string> = {
  'top-right': 'right-4 top-4',
  'top-left': 'left-4 top-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'left-1/2 top-4 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export function ToastProvider({ children, position = 'top-right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastPayload[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const showToast = useCallback((type: ToastType, message: string, options?: ToastOptions | number) => {
    toast[type](message, options)
  }, [])

  const value = useMemo<ToastContextValue>(() => ({
    showToast,
    success: (message, options) => showToast('success', message, options),
    error: (message, options) => showToast('error', message, options),
    info: (message, options) => showToast('info', message, options),
  }), [showToast])

  useEffect(() => subscribeToToasts((nextToast) => {
    setToasts((current) => [...current, nextToast])
  }), [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={cn('pointer-events-none fixed z-[100] flex flex-col gap-3', positionClasses[position])}>
        {toasts.map((item) => <ToastComponent key={item.id} toast={item} onClose={removeToast} />)}
      </div>
    </ToastContext.Provider>
  )
}
