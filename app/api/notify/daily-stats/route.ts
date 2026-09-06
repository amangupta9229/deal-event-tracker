import { NextResponse } from "next/server"
import { Resend } from "resend"
import { buildDailySummaryHtml } from "@/lib/email/daily-summary"
import { getStatsEmailRecipients } from "@/lib/queries"
import type { AppData } from "@/types"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    to?: string | string[]
    data?: AppData
    appUrl?: string
  }

  if (!body.data?.events || !body.data.profiles) {
    return NextResponse.json({ error: "Missing event data." }, { status: 400 })
  }

  const requested = Array.isArray(body.to) ? body.to : body.to ? [body.to] : []
  const to = (requested.length > 0 ? requested : getStatsEmailRecipients(body.data))
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.includes("@"))

  if (to.length === 0) {
    return NextResponse.json({ error: "Missing recipient." }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const html = buildDailySummaryHtml(
    body.data,
    body.appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  )
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Defpro Global — open tickets",
    html,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sent: to.length })
}
