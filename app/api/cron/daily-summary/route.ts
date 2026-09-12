import { Resend } from "resend"
import { NextResponse } from "next/server"
import { buildAssignedDigestHtml, buildDailySummaryHtml } from "@/lib/email/daily-summary"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import {
  getAllOpenDigestRecipients,
  getAssignableProfiles,
  itemsAssignedToUser,
} from "@/lib/queries"
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
    version: 3,
    profiles: profiles.data ?? [],
    deals: deals.data ?? [],
    events: events.data ?? [],
    comments: comments.data ?? [],
  }

  const digestRecipients = getAllOpenDigestRecipients(data)
  const html = buildDailySummaryHtml(data, appUrl)
  const resend = new Resend(apiKey)
  let sent = 0

  if (digestRecipients.length > 0) {
    const { error } = await resend.emails.send({
      from,
      to: digestRecipients,
      subject: "Defpro Global — all open orders & actions",
      html,
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    sent += digestRecipients.length
  }

  for (const profile of getAssignableProfiles(data)) {
    const assigned = itemsAssignedToUser(data, profile.id)
    if (assigned.orders.length === 0 && assigned.actions.length === 0) continue
    if (!profile.email.includes("@")) continue
    const { error } = await resend.emails.send({
      from,
      to: profile.email,
      subject: "Defpro Global — assigned to you",
      html: buildAssignedDigestHtml(data, appUrl, profile.id),
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    sent += 1
  }

  return NextResponse.json({ ok: true, sent })
}
