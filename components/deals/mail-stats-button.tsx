"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TEST_STATS_EMAIL } from "@/lib/email/constants"
import { useAppStore } from "@/lib/store/context"

export function MailStatsButton() {
  const { data } = useAppStore()
  const [message, setMessage] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSend() {
    setSending(true)
    setMessage(null)
    try {
      const response = await fetch("/api/notify/daily-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: TEST_STATS_EMAIL,
          data,
          appUrl: window.location.origin,
        }),
      })
      const payload = (await response.json()) as {
        error?: string
        skipped?: boolean
      }
      if (!response.ok) {
        setMessage(payload.error ?? "Could not send email.")
        return
      }
      if (payload.skipped) {
        setMessage(
          "Email was not sent. Add RESEND_API_KEY and EMAIL_FROM to .env.local."
        )
        return
      }
      setMessage(`Open-ticket stats emailed to ${TEST_STATS_EMAIL}.`)
    } catch {
      setMessage("Could not send email.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" disabled={sending} onClick={() => void handleSend()}>
        Email open-ticket stats
      </Button>
      {message && (
        <p className="max-w-xs text-right text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
