export type ToastType = 'success' | 'error' | 'info'

export type ToastOptions = {
  description?: string
  duration?: number
}

export type ToastPayload = {
  id: string
  type: ToastType
  message: string
  description?: string
  duration?: number
}

type ToastSubscriber = (toast: ToastPayload) => void

let subscriber: ToastSubscriber | null = null

function normalizeOptions(options?: ToastOptions | number): ToastOptions {
  if (typeof options === 'number') return { duration: options }
  return options ?? {}
}

function emit(type: ToastType, message: string, options?: ToastOptions | number) {
  const normalizedOptions = normalizeOptions(options)
  const payload: ToastPayload = {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    type,
    message,
    description: normalizedOptions.description,
    duration: normalizedOptions.duration,
  }

  subscriber?.(payload)
}

export const toast = {
  success: (message: string, options?: ToastOptions | number) => emit('success', message, options),
  error: (message: string, options?: ToastOptions | number) => emit('error', message, options),
  info: (message: string, options?: ToastOptions | number) => emit('info', message, options),
}

export function subscribeToToasts(nextSubscriber: ToastSubscriber) {
  subscriber = nextSubscriber
  return () => {
    if (subscriber === nextSubscriber) subscriber = null
  }
}
