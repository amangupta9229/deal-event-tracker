import { formatEmailCreatedAt, formatOpenDays } from "@/lib/format"
import {
  itemsAssignedToUser,
  profileName,
  sortOpenEventsByPriority,
} from "@/lib/queries"
import { PRIORITY_LABELS, type AppData, type Deal, type DealEvent } from "@/types"

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
  return wrapEmail({
    heading: "All open orders & actions",
    dateLabel: formatDateLabel(),
    trackerUrl: appUrl.replace(/\/$/, ""),
    counts: countPriority(events),
    emptyText: "There are no open actions.",
    colSpan: 7,
    rows: events.map((event) => renderOpenRow(data, event)).join(""),
  })
}

export function buildAssignedDigestHtml(
  data: AppData,
  appUrl: string,
  userId: string
) {
  const { orders, actions } = itemsAssignedToUser(data, userId)
  const orderRows =
    orders.length === 0
      ? `<tr><td colspan="2" style="padding:12px 8px;color:#667085;">No orders assigned to you.</td></tr>`
      : orders.map((order) => renderOrderRow(data, order)).join("")
  const actionRows =
    actions.length === 0
      ? `<tr><td colspan="6" style="padding:12px 8px;color:#667085;">No open actions assigned to you.</td></tr>`
      : actions.map((event) => renderAssignedActionRow(data, event)).join("")

  const trackerUrl = appUrl.replace(/\/$/, "")
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1d2939;">
    <div style="max-width:980px;margin:0 auto;padding:20px 12px 28px;">
      <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#475467;">Defpro Global</p>
      <h1 style="margin:6px 0 4px;font-size:18px;font-weight:700;">Assigned to you</h1>
      <p style="margin:0 0 16px;font-size:13px;color:#475467;">${escapeHtml(formatDateLabel())}</p>
      <h2 style="margin:0 0 8px;font-size:14px;">Your orders</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #d0d5dd;font-size:12px;margin-bottom:18px;">
        <thead>
          <tr style="background:#f2f4f7;color:#475467;text-align:left;">
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Order</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Assigned to</th>
          </tr>
        </thead>
        <tbody>${orderRows}</tbody>
      </table>
      <h2 style="margin:0 0 8px;font-size:14px;">Your open actions</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #d0d5dd;font-size:12px;">
        <thead>
          <tr style="background:#f2f4f7;color:#475467;text-align:left;">
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Order</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Action</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Created</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;text-align:right;">Open (days)</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Priority</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Assigned to</th>
          </tr>
        </thead>
        <tbody>${actionRows}</tbody>
      </table>
      <p style="margin:14px 0 0;font-size:12px;">
        <a href="${escapeHtml(trackerUrl)}" style="color:#175cd3;">Open tracker</a>
      </p>
    </div>
  </body>
</html>`
}

function wrapEmail(input: {
  heading: string
  dateLabel: string
  trackerUrl: string
  counts: { urgent: number; high: number; normal: number; low: number; total: number }
  emptyText: string
  colSpan: number
  rows: string
}) {
  const rows =
    input.rows ||
    `<tr><td colspan="${input.colSpan}" style="padding:12px 8px;color:#667085;">${input.emptyText}</td></tr>`
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1d2939;">
    <div style="max-width:1080px;margin:0 auto;padding:20px 12px 28px;">
      <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#475467;">Defpro Global</p>
      <h1 style="margin:6px 0 4px;font-size:18px;font-weight:700;">${escapeHtml(input.heading)}</h1>
      <p style="margin:0 0 12px;font-size:13px;color:#475467;">${escapeHtml(input.dateLabel)}</p>
      <p style="margin:0 0 14px;font-size:13px;color:#344054;">
        Urgent <strong>${input.counts.urgent}</strong>
        &nbsp;·&nbsp; High <strong>${input.counts.high}</strong>
        &nbsp;·&nbsp; Normal <strong>${input.counts.normal}</strong>
        &nbsp;·&nbsp; Low <strong>${input.counts.low}</strong>
        &nbsp;·&nbsp; <strong>${input.counts.total} open</strong>
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #d0d5dd;font-size:12px;line-height:1.35;">
        <thead>
          <tr style="background:#f2f4f7;color:#475467;text-align:left;">
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Order</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Action</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Created</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;text-align:right;">Open (days)</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Priority</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Order assigned to</th>
            <th style="padding:6px 8px;border-bottom:1px solid #d0d5dd;">Action assigned to</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:14px 0 0;font-size:12px;">
        <a href="${escapeHtml(input.trackerUrl)}" style="color:#175cd3;">Open tracker</a>
      </p>
    </div>
  </body>
</html>`
}

function renderOpenRow(data: AppData, event: DealEvent) {
  const deal = data.deals.find((item) => item.id === event.deal_id)
  const priorityColor = PRIORITY_COLOR[event.priority]
  return `<tr>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;white-space:nowrap;">${escapeHtml(deal?.name ?? "Unknown order")}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;">${escapeHtml(truncate(event.description, 90))}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;white-space:nowrap;color:#475467;">${escapeHtml(formatEmailCreatedAt(event.created_at))}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;text-align:right;">${formatOpenDays(event.created_at)}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;font-weight:700;color:${priorityColor};">${escapeHtml(PRIORITY_LABELS[event.priority])}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;white-space:nowrap;">${escapeHtml(profileName(data, deal?.assigned_to))}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;vertical-align:top;white-space:nowrap;">${escapeHtml(profileName(data, event.assigned_to))}</td>
  </tr>`
}

function renderAssignedActionRow(data: AppData, event: DealEvent) {
  const deal = data.deals.find((item) => item.id === event.deal_id)
  const priorityColor = PRIORITY_COLOR[event.priority]
  return `<tr>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;">${escapeHtml(deal?.name ?? "Unknown order")}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;">${escapeHtml(truncate(event.description, 90))}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;white-space:nowrap;color:#475467;">${escapeHtml(formatEmailCreatedAt(event.created_at))}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;text-align:right;">${formatOpenDays(event.created_at)}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;font-weight:700;color:${priorityColor};">${escapeHtml(PRIORITY_LABELS[event.priority])}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;">${escapeHtml(profileName(data, event.assigned_to))}</td>
  </tr>`
}

function renderOrderRow(data: AppData, order: Deal) {
  return `<tr>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;">${escapeHtml(order.name)}</td>
    <td style="padding:5px 8px;border-bottom:1px solid #eaecf0;">${escapeHtml(profileName(data, order.assigned_to))}</td>
  </tr>`
}

function countPriority(events: DealEvent[]) {
  return {
    urgent: events.filter((event) => event.priority === "urgent").length,
    high: events.filter((event) => event.priority === "high").length,
    normal: events.filter((event) => event.priority === "normal").length,
    low: events.filter((event) => event.priority === "low").length,
    total: events.length,
  }
}

function formatDateLabel() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date())
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
