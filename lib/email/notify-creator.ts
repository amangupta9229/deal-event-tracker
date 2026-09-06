export async function notifyComment(input: {
  to: string[]
  dealName: string
  eventDescription: string
  comment: string
  authorName: string
  eventUrl: string
}) {
  const comment = input.comment.trim()
  const recipients = input.to.filter((email) => email.includes("@"))
  if (!comment || recipients.length === 0) return
  try {
    await fetch("/api/notify/owner-comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, comment, to: recipients }),
    })
  } catch {
    // Email is best-effort; the in-app record still saves.
  }
}
