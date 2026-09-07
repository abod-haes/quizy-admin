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
const RECENT_TOAST_WINDOW_MS = 2500
const recentToastSignatures = new Map<string, number>()

function normalizeOptions(options?: ToastOptions | number): ToastOptions {
  if (typeof options === 'number') return { duration: options }
  return options ?? {}
}

function toastSignature(type: ToastType, message: string, description?: string) {
  return `${type}::${message.trim()}::${description?.trim() ?? ''}`
}

function shouldSuppressDuplicate(signature: string) {
  const now = Date.now()
  const lastEmittedAt = recentToastSignatures.get(signature)

  for (const [key, emittedAt] of recentToastSignatures) {
    if (now - emittedAt > RECENT_TOAST_WINDOW_MS) recentToastSignatures.delete(key)
  }

  if (lastEmittedAt !== undefined && now - lastEmittedAt <= RECENT_TOAST_WINDOW_MS) {
    return true
  }

  recentToastSignatures.set(signature, now)
  return false
}

function emit(type: ToastType, message: string, options?: ToastOptions | number) {
  const normalizedOptions = normalizeOptions(options)
  const signature = toastSignature(type, message, normalizedOptions.description)
  if (shouldSuppressDuplicate(signature)) return

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
