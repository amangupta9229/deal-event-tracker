export type UserRole = "admin" | "owner" | "team"
export type DealStatus = "active" | "archived"
export type EventStatus = "open" | "closed" | "na"
export type EventPriority = "low" | "normal" | "high" | "urgent"

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Deal {
  id: string
  name: string
  status: DealStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface DealEvent {
  id: string
  deal_id: string
  description: string
  priority: EventPriority
  status: EventStatus
  created_by: string
  created_at: string
  updated_at: string
  done_by: string | null
  done_at: string | null
}

export interface EventComment {
  id: string
  event_id: string
  author_id: string
  comment: string
  created_at: string
}

export interface AppData {
  version: number
  profiles: Profile[]
  deals: Deal[]
  events: DealEvent[]
  comments: EventComment[]
}

export const PRIORITY_ORDER: EventPriority[] = [
  "urgent",
  "high",
  "normal",
  "low",
]

export const PRIORITY_RANK: Record<EventPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  owner: "Owner",
  team: "Team Member",
}

export const PRIORITY_LABELS: Record<EventPriority, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
}

export const STATUS_LABELS: Record<EventStatus, string> = {
  open: "Open",
  closed: "Closed",
  na: "NA",
}
