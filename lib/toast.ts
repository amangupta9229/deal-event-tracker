type ToastListener = (message: string) => void

const listeners = new Set<ToastListener>()

export function toast(message: string) {
  const text = message.trim()
  if (!text) return
  for (const listener of listeners) listener(text)
}

export function subscribeToasts(listener: ToastListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
