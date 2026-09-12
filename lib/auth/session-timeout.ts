"use client"

import { useEffect } from "react"
import {
  SESSION_ACTIVITY_KEY,
  SESSION_IDLE_MS,
  SESSION_MAX_MS,
  SESSION_STARTED_KEY,
} from "@/lib/auth/constants"

export function markSessionFresh() {
  const now = String(Date.now())
  window.localStorage.setItem(SESSION_STARTED_KEY, now)
  window.localStorage.setItem(SESSION_ACTIVITY_KEY, now)
}

export function clearSessionTimers() {
  window.localStorage.removeItem(SESSION_STARTED_KEY)
  window.localStorage.removeItem(SESSION_ACTIVITY_KEY)
}

function isExpired() {
  const started = Number(window.localStorage.getItem(SESSION_STARTED_KEY) ?? "")
  const activity = Number(window.localStorage.getItem(SESSION_ACTIVITY_KEY) ?? "")
  const now = Date.now()
  if (!started || now - started >= SESSION_MAX_MS) return true
  if (!activity || now - activity >= SESSION_IDLE_MS) return true
  return false
}

export function useSessionTimeout(active: boolean, onTimeout: () => void | Promise<void>) {
  useEffect(() => {
    if (!active) return

    let lastTouch = 0

    const check = () => {
      if (isExpired()) {
        clearSessionTimers()
        void onTimeout()
      }
    }

    const touch = () => {
      const now = Date.now()
      if (now - lastTouch < 5000) return
      lastTouch = now
      window.localStorage.setItem(SESSION_ACTIVITY_KEY, String(now))
    }

    check()
    const timer = window.setInterval(check, 15_000)
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll"]
    for (const event of events) {
      window.addEventListener(event, touch, { passive: true })
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") check()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      window.clearInterval(timer)
      for (const event of events) {
        window.removeEventListener(event, touch)
      }
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [active, onTimeout])
}
