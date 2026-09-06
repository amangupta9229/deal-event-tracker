import { NextResponse } from "next/server"
import { Resend } from "resend"
import { buildOwnerCommentEmailHtml } from "@/lib/email/owner-comment"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    to?: string | string[]
    dealName?: string
    eventDescription?: string
    comment?: string
    authorName?: string
    reviewerName?: string
    eventUrl?: string
  }

  const recipients = (Array.isArray(body.to) ? body.to : [body.to ?? ""])
    .map((item) => item.trim())
    .filter((item) => item.includes("@"))
  const comment = body.comment?.trim() ?? ""
  if (recipients.length === 0 || !comment) {
    return NextResponse.json({ error: "Missing recipient or comment." }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const html = buildOwnerCommentEmailHtml({
    dealName: body.dealName?.trim() || "Deal",
    eventDescription: body.eventDescription?.trim() || "",
    comment,
    authorName: body.authorName?.trim() || body.reviewerName?.trim() || "A teammate",
    eventUrl: body.eventUrl?.trim() || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  })

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to: recipients,
    subject: "New comment on a Defpro deal event",
    html,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
