import { Resend } from "resend"
import { NextResponse } from "next/server"
import { buildDailySummaryHtml } from "@/lib/email/daily-summary"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getStatsEmailRecipients } from "@/lib/queries"
import type { AppData } from "@/types"

export const runtime = "nodejs"

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get("authorization")
  return header === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 400 }
    )
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM?.trim().replace(/^["']|["']$/g, "")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "RESEND_API_KEY and EMAIL_FROM must be set." },
      { status: 500 }
    )
  }

  const admin = createServiceRoleClient()
  const [profiles, deals, events, comments] = await Promise.all([
    admin.from("profiles").select("*"),
    admin.from("deals").select("*"),
    admin.from("events").select("*"),
    admin.from("event_comments").select("*"),
  ])

  if (profiles.error || deals.error || events.error || comments.error) {
    return NextResponse.json(
      {
        error:
          profiles.error?.message ??
          deals.error?.message ??
          events.error?.message ??
          comments.error?.message,
      },
      { status: 500 }
    )
  }

  const data: AppData = {
    version: 2,
    profiles: profiles.data ?? [],
    deals: deals.data ?? [],
    events: events.data ?? [],
    comments: comments.data ?? [],
  }

  const recipients = getStatsEmailRecipients(data)
  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no_recipients" })
  }

  const html = buildDailySummaryHtml(data, appUrl)
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: recipients,
    subject: "Defpro Global — open tickets",
    html,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sent: recipients.length })
}
