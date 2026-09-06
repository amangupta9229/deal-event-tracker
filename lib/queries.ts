import { PRIORITY_RANK, type AppData, type DealEvent, type Profile } from "@/types"

export function getProfile(data: AppData, id: string): Profile | undefined {
  return data.profiles.find((profile) => profile.id === id)
}

export function getActiveOwners(data: AppData): Profile[] {
  return data.profiles
    .filter((profile) => profile.role === "owner" && profile.is_active)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export function getStatsEmailRecipients(data: AppData): string[] {
  const seen = new Set<string>()
  const emails: string[] = []
  for (const profile of data.profiles) {
    if (!profile.is_active) continue
    const email = profile.email.trim().toLowerCase()
    if (!email.includes("@") || seen.has(email)) continue
    seen.add(email)
    emails.push(email)
  }
  return emails
}

export function getDealLastActivity(data: AppData, dealId: string): string {
  const deal = data.deals.find((item) => item.id === dealId)
  const timestamps = data.events
    .filter((event) => event.deal_id === dealId)
    .flatMap((event) => [event.created_at, event.updated_at])
  if (deal) timestamps.push(deal.updated_at, deal.created_at)
  return timestamps.sort().at(-1) ?? new Date(0).toISOString()
}

export function countOpenEvents(data: AppData, dealId: string): number {
  return data.events.filter(
    (event) => event.deal_id === dealId && event.status === "open"
  ).length
}

export function countUrgentOpenEvents(data: AppData, dealId: string): number {
  return data.events.filter(
    (event) =>
      event.deal_id === dealId &&
      event.status === "open" &&
      event.priority === "urgent"
  ).length
}

export function sortEventsNewestFirst(events: DealEvent[]): DealEvent[] {
  return [...events].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function sortOpenEventsByPriority(events: DealEvent[]): DealEvent[] {
  return [...events].sort((a, b) => {
    const rank = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (rank !== 0) return rank
    return a.created_at.localeCompare(b.created_at)
  })
}

export function getEventComments(data: AppData, eventId: string) {
  return data.comments
    .filter((comment) => comment.event_id === eventId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export function commentMailRecipients(
  data: AppData,
  event: DealEvent,
  authorId: string
): string[] {
  const author = data.profiles.find((profile) => profile.id === authorId)
  const creator = data.profiles.find((profile) => profile.id === event.created_by)
  if (!author) return []

  if (author.role === "team") {
    return getActiveOwners(data)
      .map((owner) => owner.email)
      .filter(Boolean)
  }

  if (creator && creator.email && creator.id !== author.id) {
    return [creator.email]
  }
  return []
}
