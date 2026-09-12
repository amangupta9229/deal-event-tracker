export function buildAssignmentEmailHtml(input: {
  title: string
  intro: string
  orderName: string
  actionDescription?: string | null
  assigneeName: string
  url: string
}) {
  const actionBlock = input.actionDescription
    ? `<p style="margin:0;color:#475467;font-size:12px;">Action</p>
        <p style="margin:4px 0 12px;">${escapeHtml(input.actionDescription)}</p>`
    : ""
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1d2939;">
    <div style="max-width:640px;margin:0 auto;padding:20px 12px 28px;">
      <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#475467;">Defpro Global</p>
      <h1 style="margin:6px 0 8px;font-size:18px;font-weight:700;">${escapeHtml(input.title)}</h1>
      <p style="margin:0 0 14px;font-size:13px;color:#475467;">${escapeHtml(input.intro)}</p>
      <div style="background:#ffffff;border:1px solid #d0d5dd;padding:12px 14px;">
        <p style="margin:0;color:#475467;font-size:12px;">Order</p>
        <p style="margin:4px 0 12px;">${escapeHtml(input.orderName)}</p>
        ${actionBlock}
        <p style="margin:0;color:#475467;font-size:12px;">Assigned to</p>
        <p style="margin:4px 0 0;">${escapeHtml(input.assigneeName)}</p>
      </div>
      <p style="margin:14px 0 0;font-size:12px;">
        <a href="${escapeHtml(input.url)}" style="color:#175cd3;text-decoration:underline;">Open tracker</a>
      </p>
    </div>
  </body>
</html>`
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
