"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { nowIso } from "@/lib/format"
import { seedData, STORE_STORAGE_KEY, STORE_VERSION } from "@/lib/mock/seed"
import { AppStoreProvider } from "@/lib/store/context"
import { toast } from "@/lib/toast"
import type { AppStoreValue, CreateDealInput, CreateEventInput, CreateUserInput } from "@/lib/store/types"
import type {
  AppData,
  Deal,
  DealEvent,
  DealStatus,
  EventComment,
  EventStatus,
  Profile,
  UserRole,
} from "@/types"

function parseStoredData(raw: string | null): AppData | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AppData
    if (parsed.version !== STORE_VERSION) return null
    if (!Array.isArray(parsed.profiles) || !Array.isArray(parsed.deals) || !Array.isArray(parsed.comments)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(seedData)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = parseStoredData(window.localStorage.getItem(STORE_STORAGE_KEY))
    queueMicrotask(() => {
      if (stored) setData(stored)
      setHydrated(true)
    })
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(data))
  }, [data, hydrated])

  const createDeal = useCallback((input: CreateDealInput) => {
    const timestamp = nowIso()
    const deal: Deal = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      status: "active",
      created_by: input.createdBy,
      assigned_to: input.assignedTo,
      created_at: timestamp,
      updated_at: timestamp,
    }
    setData((current) => ({ ...current, deals: [deal, ...current.deals] }))
    toast("Order created")
    return deal
  }, [])

  const updateDealStatus = useCallback((dealId: string, status: DealStatus) => {
    const timestamp = nowIso()
    setData((current) => ({
      ...current,
      deals: current.deals.map((deal) =>
        deal.id === dealId ? { ...deal, status, updated_at: timestamp } : deal
      ),
    }))
    toast(status === "archived" ? "Order archived" : "Order restored")
  }, [])

  const createEvent = useCallback((input: CreateEventInput) => {
    const timestamp = nowIso()
    const event: DealEvent = {
      id: crypto.randomUUID(),
      deal_id: input.dealId,
      description: input.description.trim(),
      priority: input.priority,
      status: "open",
      created_by: input.createdBy,
      assigned_to: input.assignedTo,
      created_at: timestamp,
      updated_at: timestamp,
      done_by: null,
      done_at: null,
    }
    setData((current) => ({
      ...current,
      events: [event, ...current.events],
      deals: current.deals.map((deal) =>
        deal.id === input.dealId ? { ...deal, updated_at: timestamp } : deal
      ),
    }))
    toast("Action saved")
    return event
  }, [])

  const setEventStatus = useCallback(
    (eventId: string, status: Extract<EventStatus, "closed" | "na">, doneBy: string) => {
      const timestamp = nowIso()
      setData((current) => {
        const existing = current.events.find((event) => event.id === eventId)
        if (!existing || existing.status !== "open") return current
        return {
          ...current,
          events: current.events.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  status,
                  done_by: doneBy,
                  done_at: timestamp,
                  updated_at: timestamp,
                }
              : event
          ),
          deals: current.deals.map((deal) =>
            deal.id === existing.deal_id
              ? { ...deal, updated_at: timestamp }
              : deal
          ),
        }
      })
      toast(status === "closed" ? "Marked done" : "Marked NA")
    },
    []
  )

  const setDealAssignee = useCallback((dealId: string, assignedTo: string) => {
    const timestamp = nowIso()
    setData((current) => ({
      ...current,
      deals: current.deals.map((deal) =>
        deal.id === dealId ? { ...deal, assigned_to: assignedTo, updated_at: timestamp } : deal
      ),
    }))
    toast("Assignee updated")
  }, [])

  const setEventAssignee = useCallback((eventId: string, assignedTo: string) => {
    const timestamp = nowIso()
    setData((current) => ({
      ...current,
      events: current.events.map((event) =>
        event.id === eventId
          ? { ...event, assigned_to: assignedTo, updated_at: timestamp }
          : event
      ),
    }))
    toast("Assignee updated")
  }, [])

  const addComment = useCallback(
    (eventId: string, authorId: string, comment: string) => {
      const trimmed = comment.trim()
      const entry: EventComment = {
        id: crypto.randomUUID(),
        event_id: eventId,
        author_id: authorId,
        comment: trimmed,
        created_at: nowIso(),
      }
      setData((current) => {
        const existing = current.events.find((event) => event.id === eventId)
        if (!existing || existing.status !== "open" || !trimmed) return current
        return { ...current, comments: [...current.comments, entry] }
      })
      toast("Comment sent")
      return entry
    },
    []
  )

  const createUser = useCallback((input: CreateUserInput) => {
    const profile: Profile = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      is_active: true,
      created_at: nowIso(),
    }
    setData((current) => {
      const exists = current.profiles.some(
        (item) => item.email.toLowerCase() === profile.email
      )
      if (exists) return current
      return { ...current, profiles: [...current.profiles, profile] }
    })
    toast("User created")
    return profile
  }, [])

  const updateUserRole = useCallback((userId: string, role: UserRole) => {
    setData((current) => ({
      ...current,
      profiles: current.profiles.map((profile) =>
        profile.id === userId ? { ...profile, role } : profile
      ),
    }))
    toast("Role updated")
  }, [])

  const setUserActive = useCallback((userId: string, isActive: boolean) => {
    setData((current) => ({
      ...current,
      profiles: current.profiles.map((profile) =>
        profile.id === userId ? { ...profile, is_active: isActive } : profile
      ),
    }))
    toast(isActive ? "User enabled" : "User disabled")
  }, [])

  const deleteEvent = useCallback((eventId: string) => {
    setData((current) => ({
      ...current,
      events: current.events.filter((event) => event.id !== eventId),
      comments: current.comments.filter((comment) => comment.event_id !== eventId),
    }))
    toast("Action deleted")
  }, [])

  const deleteDeal = useCallback((dealId: string) => {
    setData((current) => {
      const ids = new Set(
        current.events.filter((event) => event.deal_id === dealId).map((event) => event.id)
      )
      return {
        ...current,
        deals: current.deals.filter((deal) => deal.id !== dealId),
        events: current.events.filter((event) => event.deal_id !== dealId),
        comments: current.comments.filter((comment) => !ids.has(comment.event_id)),
      }
    })
    toast("Order deleted")
  }, [])

  const deleteUser = useCallback((userId: string) => {
    setData((current) => {
      const remaining = current.profiles.filter((profile) => profile.id !== userId)
      const fallback =
        remaining.find(
          (profile) =>
            profile.is_active && (profile.role === "owner" || profile.role === "team")
        )?.id ?? remaining[0]?.id
      if (!fallback) return current
      const remap = (id: string | null) => (id === userId ? fallback : id)
      return {
        ...current,
        profiles: remaining,
        deals: current.deals.map((deal) => ({
          ...deal,
          created_by: remap(deal.created_by) ?? fallback,
          assigned_to: remap(deal.assigned_to) ?? fallback,
        })),
        events: current.events.map((event) => ({
          ...event,
          created_by: remap(event.created_by) ?? fallback,
          assigned_to: remap(event.assigned_to) ?? fallback,
          done_by: remap(event.done_by),
        })),
        comments: current.comments.map((comment) => ({
          ...comment,
          author_id: remap(comment.author_id) ?? fallback,
        })),
      }
    })
    toast("User deleted")
  }, [])

  const value = useMemo<AppStoreValue>(
    () => ({
      hydrated,
      data,
      createDeal,
      updateDealStatus,
      setDealAssignee,
      createEvent,
      setEventStatus,
      setEventAssignee,
      addComment,
      createUser,
      updateUserRole,
      setUserActive,
      deleteEvent,
      deleteDeal,
      deleteUser,
    }),
    [
      hydrated,
      data,
      createDeal,
      updateDealStatus,
      setDealAssignee,
      createEvent,
      setEventStatus,
      setEventAssignee,
      addComment,
      createUser,
      updateUserRole,
      setUserActive,
      deleteEvent,
      deleteDeal,
      deleteUser,
    ]
  )

  return <AppStoreProvider value={value}>{children}</AppStoreProvider>
}
