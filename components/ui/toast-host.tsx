"use client"

import { useEffect, useState } from "react"
import { subscribeToasts } from "@/lib/toast"

const SHOW_MS = 2600

export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let hide: number | undefined
    return subscribeToasts((next) => {
      setMessage(next)
      window.clearTimeout(hide)
      hide = window.setTimeout(() => setMessage(null), SHOW_MS)
    })
  }, [])

  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4"
    >
      <p className="rounded-full border bg-foreground px-4 py-2 text-sm text-background shadow-lg">
        {message}
      </p>
    </div>
  )
}
