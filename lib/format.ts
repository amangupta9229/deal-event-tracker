export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date)
}

export function formatCompactDateTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date)
}

export function formatAge(iso: string, now = new Date()): string {
  const then = new Date(iso).getTime()
  const diffMs = Math.max(0, now.getTime() - then)
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"}`
}

export function formatRelativeActivity(iso: string, now = new Date()): string {
  const then = new Date(iso)
  const diffMs = Math.max(0, now.getTime() - then.getTime())
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`

  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfThen = new Date(then)
  startOfThen.setHours(0, 0, 0, 0)
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfThen.getTime()) / 86_400_000
  )
  if (dayDiff === 1) return "Yesterday"
  return `${dayDiff} days ago`
}

export function formatOpenDays(iso: string, now = new Date()): number {
  const diffMs = Math.max(0, now.getTime() - new Date(iso).getTime())
  return Math.floor(diffMs / 86_400_000)
}

export function formatEmailCreatedAt(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date)
}

export function formatDurationMs(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${Math.max(1, minutes)} min`
  const hours = minutes / 60
  if (hours < 24) return `${hours < 10 ? hours.toFixed(1) : Math.round(hours)} hr`
  const days = hours / 24
  return `${days < 10 ? days.toFixed(1) : Math.round(days)} days`
}

export function nowIso(): string {
  return new Date().toISOString()
}
