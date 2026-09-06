import { formatEmailCreatedAt, formatOpenDays } from "@/lib/format"
import { sortOpenEventsByPriority } from "@/lib/queries"
import { PRIORITY_LABELS, type AppData, type DealEvent } from "@/types"

const PRIORITY_COLOR: Record<DealEvent["priority"], string> = {
  urgent: "#b42318",
  high: "#b54708",
  normal: "#175cd3",
  low: "#667085",
}

export function getDailySummaryEvents(data: AppData): DealEvent[] {
  return sortOpenEventsByPriority(
    data.events.filter((event) => event.status === "open")
  )
}

export function buildDailySummaryHtml(data: AppData, appUrl: string) {
  const events = getDailySummaryEvents(data)
  const trackerUrl = appUrl.replace(/\/$/, "")
  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date())

  const urgentOpen = events.filter((event) => event.priority === "urgent").length
  const highOpen = events.filter((event) => event.priority === "high").length
  const normalOpen = events.filter((event) => event.priority === "normal").length
  const lowOpen = events.filter((event) => event.priority === "low").length

  const rows =
    events.length === 0
      ? `<tr><td colspan="5" style="padding:12px 8px;color:#667085;">There are no open events.</td></tr>`
      : events.map((event) => renderRow(data, event)).join("")

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1d2939;">
    <div style="max-width:980px;margin:0 auto;padding:20px 12px 28px;">
      <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#475467;">Defpro Global</p>
      <h1 style="margin:6px 0 4px;font-size:18px;font-weight:700;">Open tickets</h1>
      <p style="margin:0 0 12px;font-size:13px;color:#475467;">${escapeHtml(dateLabel)}</p>
      <p style="margin:0 0 14px;font-size:13px;color:#344054;">
        Urgent <strong>${urgentOpen}</strong>
        &nbsp;·&nbsp; High <strong>${highOpen}</strong>
        &nbsp;·&nbsp; Normal <strong>${normalOpen}</strong>
        &nbsp;·&nbsp; Low <strong>${lowOpen}</strong>
        &nbsp;·&nbsp; <strong>${events.length} open</strong>
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #d0d5dd;font-size:12px;line-height:1.35;">
        <thead>
          <tr style="background:#f2f4f7;color:#475467;text-align:left;">
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;font-weight:600;">Deal</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;font-weight:600;">Event</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;font-weight:600;white-space:nowrap;">Created</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;font-weight:600;white-space:nowrap;text-align:right;">Open (days)</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;font-weight:600;">Priority</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="margin:14px 0 0;font-size:12px;">
        <a href="${escapeHtml(trackerUrl)}" style="color:#175cd3;text-decoration:underline;">Open tracker</a>
      </p>
    </div>
  </body>
</html>`
}

function renderRow(data: AppData, event: DealEvent) {
  const deal = data.deals.find((item) => item.id === event.deal_id)
  const priorityColor = PRIORITY_COLOR[event.priority]
  return `<tr>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;white-space:nowrap;">${escapeHtml(deal?.name ?? "Unknown deal")}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;">${escapeHtml(truncate(event.description, 90))}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;white-space:nowrap;color:#475467;">${escapeHtml(formatEmailCreatedAt(event.created_at))}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;text-align:right;white-space:nowrap;">${formatOpenDays(event.created_at)}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;white-space:nowrap;font-weight:700;color:${priorityColor};">${escapeHtml(PRIORITY_LABELS[event.priority])}</td>
  </tr>`
}

function truncate(value: string, max: number) {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
