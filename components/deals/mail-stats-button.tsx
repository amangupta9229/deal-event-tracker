"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getStatsEmailRecipients } from "@/lib/queries"
import { useAppStore } from "@/lib/store/context"

export function MailStatsButton() {
  const { data } = useAppStore()
  const [message, setMessage] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSend() {
    const recipients = getStatsEmailRecipients(data)
    if (recipients.length === 0) {
      setMessage("No active users to email.")
      setSending(false)
      return
    }
    setSending(true)
    setMessage(null)
    try {
      const response = await fetch("/api/notify/daily-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipients,
          data,
          appUrl: window.location.origin,
        }),
      })
      const payload = (await response.json()) as {
        error?: string
        skipped?: boolean
        from?: string
        sent?: number
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
      const count = payload.sent ?? recipients.length
      setMessage(
        `Sent to ${count} ${count === 1 ? "person" : "people"} from ${payload.from ?? "unknown"}.`
      )
    } catch {
      setMessage("Could not send email.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" disabled={sending} onClick={() => void handleSend()}>
        Email open actions
      </Button>
      {message && (
        <p className="max-w-xs text-right text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
