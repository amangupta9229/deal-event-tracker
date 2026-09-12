import { NextResponse } from "next/server"
import { Resend } from "resend"
import { buildAssignmentEmailHtml } from "@/lib/email/assignment"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    to?: string | string[]
    title?: string
    intro?: string
    orderName?: string
    actionDescription?: string | null
    assigneeName?: string
    url?: string
    subject?: string
  }

  const recipients = (Array.isArray(body.to) ? body.to : [body.to ?? ""])
    .map((item) => item.trim())
    .filter((item) => item.includes("@"))
  if (recipients.length === 0) {
    return NextResponse.json({ error: "Missing recipient." }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM?.trim().replace(/^["']|["']$/g, "")
  if (!apiKey || !from) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const html = buildAssignmentEmailHtml({
    title: body.title?.trim() || "Assignment updated",
    intro: body.intro?.trim() || "An assignment was updated.",
    orderName: body.orderName?.trim() || "Order",
    actionDescription: body.actionDescription,
    assigneeName: body.assigneeName?.trim() || "Someone",
    url: body.url?.trim() || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  })
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: recipients,
    subject: body.subject?.trim() || "Defpro Global — assigned to you",
    html,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
