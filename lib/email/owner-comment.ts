export function buildOwnerCommentEmailHtml(input: {
  dealName: string
  eventDescription: string
  comment: string
  authorName: string
  eventUrl: string
}) {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;background:#121212;font-family:Arial,sans-serif;color:#f3e6e0;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <p style="letter-spacing:0.16em;text-transform:uppercase;font-size:12px;color:#e8b4b8;margin:0 0 16px;">Defpro Global</p>
      <h1 style="font-size:20px;margin:0 0 12px;">New comment on an action</h1>
      <p style="color:#c4b8b2;margin:0 0 20px;">${escapeHtml(input.authorName)} added a comment.</p>
      <div style="background:#1c1c1c;border:1px solid #2a2a2a;border-radius:12px;padding:16px 20px;">
        <p style="margin:0;color:#c4b8b2;font-size:12px;">Order</p>
        <p style="margin:4px 0 12px;">${escapeHtml(input.dealName)}</p>
        <p style="margin:0;color:#c4b8b2;font-size:12px;">Action</p>
        <p style="margin:4px 0 12px;">${escapeHtml(input.eventDescription)}</p>
        <p style="margin:0;color:#c4b8b2;font-size:12px;">Comment</p>
        <p style="margin:4px 0 0;">“${escapeHtml(input.comment)}”</p>
      </div>
      <p style="margin:20px 0 0;">
        <a href="${escapeHtml(input.eventUrl)}" style="display:inline-block;background:#e8b4b8;color:#121212;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:13px;">View action</a>
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
