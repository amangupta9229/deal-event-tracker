import type { UserRole } from "@/types"

export function canComment(role: UserRole): boolean {
  return role === "team" || role === "owner" || role === "admin"
}

export function canResolveEvent(role: UserRole): boolean {
  return role === "owner" || role === "admin"
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin"
}

export function canAssign(role: UserRole): boolean {
  return role === "owner" || role === "admin"
}

export function canManageDeals(role: UserRole): boolean {
  return role === "admin"
}

export function canSeeOpenEventsInbox(role: UserRole): boolean {
  return role === "owner" || role === "admin"
}

export function canSendStatsEmail(role: UserRole): boolean {
  return role === "owner" || role === "admin"
}

export function canDeleteEvent(role: UserRole): boolean {
  return role === "owner" || role === "admin"
}

export function canDeleteDeal(role: UserRole): boolean {
  return role === "admin"
}

export function canDeleteUser(role: UserRole): boolean {
  return role === "admin"
}
