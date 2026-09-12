"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { nowIso } from "@/lib/format"
import { seedData, STORE_STORAGE_KEY, STORE_VERSION } from "@/lib/mock/seed"
import { AppStoreProvider } from "@/lib/store/context"
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
    return profile
  }, [])

  const updateUserRole = useCallback((userId: string, role: UserRole) => {
    setData((current) => ({
      ...current,
      profiles: current.profiles.map((profile) =>
        profile.id === userId ? { ...profile, role } : profile
      ),
    }))
  }, [])

  const setUserActive = useCallback((userId: string, isActive: boolean) => {
    setData((current) => ({
      ...current,
      profiles: current.profiles.map((profile) =>
        profile.id === userId ? { ...profile, is_active: isActive } : profile
      ),
    }))
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
    ]
  )

  return <AppStoreProvider value={value}>{children}</AppStoreProvider>
}
