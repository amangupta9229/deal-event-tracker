import type { Profile } from "@/types"

export async function notifyUserAssigned(input: {
  actorId: string
  actorName: string
  assignee: Profile | undefined
  orderName: string
  actionDescription?: string | null
  url: string
  kind: "order" | "action"
}) {
  if (!input.assignee || input.assignee.id === input.actorId) return
  const isAction = input.kind === "action"
  await notifyAssignment({
    to: [input.assignee.email],
    title: isAction
      ? "An action was assigned to you"
      : "An order was assigned to you",
    intro: `${input.actorName} assigned ${isAction ? "an action" : "an order"} to you.`,
    orderName: input.orderName,
    actionDescription: input.actionDescription,
    assigneeName: input.assignee.name,
    url: input.url,
    subject: isAction
      ? "Defpro Global — action assigned to you"
      : "Defpro Global — order assigned to you",
  })
}

export async function notifyAssignment(input: {
  to: string[]
  title: string
  intro: string
  orderName: string
  actionDescription?: string | null
  assigneeName: string
  url: string
  subject: string
}) {
  const recipients = input.to.filter((email) => email.includes("@"))
  if (recipients.length === 0) return
  try {
    await fetch("/api/notify/assignment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, to: recipients }),
    })
  } catch {
    // Email is best-effort.
  }
}
