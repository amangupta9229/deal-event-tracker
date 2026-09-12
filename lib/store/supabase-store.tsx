"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { AppStoreProvider } from "@/lib/store/context"
import type {
  AppStoreValue,
  CreateDealInput,
  CreateEventInput,
  CreateUserInput,
} from "@/lib/store/types"
import type { AppData, DealStatus, EventStatus, UserRole } from "@/types"

const emptyData: AppData = {
  version: 3,
  profiles: [],
  deals: [],
  events: [],
  comments: [],
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export function SupabaseStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData)
  const [hydrated, setHydrated] = useState(false)

  const refresh = useCallback(async () => {
    const supabase = createBrowserSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setData(emptyData)
      setHydrated(true)
      return
    }

    const [profiles, deals, events, comments] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("deals").select("*"),
      supabase.from("events").select("*"),
      supabase.from("event_comments").select("*"),
    ])

    if (profiles.error || deals.error || events.error || comments.error) {
      console.error(
        profiles.error ?? deals.error ?? events.error ?? comments.error
      )
      setHydrated(true)
      return
    }

    setData({
      version: 3,
      profiles: profiles.data ?? [],
      deals: deals.data ?? [],
      events: events.data ?? [],
      comments: comments.data ?? [],
    })
    setHydrated(true)
  }, [])

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    queueMicrotask(() => {
      void refresh()
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh()
    })
    return () => subscription.unsubscribe()
  }, [refresh])

  const createDeal = useCallback(
    async (input: CreateDealInput) => {
      const supabase = createBrowserSupabaseClient()
      const { data: deal, error } = await supabase
        .from("deals")
        .insert({
          name: input.name.trim(),
          created_by: input.createdBy,
          assigned_to: input.assignedTo,
        })
        .select()
        .single()
      throwIfError(error)
      if (!deal) throw new Error("Could not create deal.")
      await refresh()
      return deal
    },
    [refresh]
  )

  const updateDealStatus = useCallback(
    async (dealId: string, status: DealStatus) => {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase
        .from("deals")
        .update({ status })
        .eq("id", dealId)
      throwIfError(error)
      await refresh()
    },
    [refresh]
  )

  const setDealAssignee = useCallback(
    async (dealId: string, assignedTo: string) => {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase
        .from("deals")
        .update({ assigned_to: assignedTo })
        .eq("id", dealId)
      throwIfError(error)
      await refresh()
    },
    [refresh]
  )

  const createEvent = useCallback(
    async (input: CreateEventInput) => {
      const supabase = createBrowserSupabaseClient()
      const { data: event, error } = await supabase
        .from("events")
        .insert({
          deal_id: input.dealId,
          description: input.description.trim(),
          priority: input.priority,
          created_by: input.createdBy,
          assigned_to: input.assignedTo,
        })
        .select()
        .single()
      throwIfError(error)
      if (!event) throw new Error("Could not create event.")
      await refresh()
      return event
    },
    [refresh]
  )

  const setEventStatus = useCallback(
    async (
      eventId: string,
      status: Extract<EventStatus, "closed" | "na">
    ) => {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be signed in.")
      const { error } = await supabase
        .from("events")
        .update({
          status,
          done_by: user.id,
          done_at: new Date().toISOString(),
        })
        .eq("id", eventId)
      throwIfError(error)
      await refresh()
    },
    [refresh]
  )

  const setEventAssignee = useCallback(
    async (eventId: string, assignedTo: string) => {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase
        .from("events")
        .update({ assigned_to: assignedTo })
        .eq("id", eventId)
      throwIfError(error)
      await refresh()
    },
    [refresh]
  )

  const addComment = useCallback(
    async (eventId: string, authorId: string, comment: string) => {
      const supabase = createBrowserSupabaseClient()
      const trimmed = comment.trim()
      const { data: saved, error } = await supabase
        .from("event_comments")
        .insert({
          event_id: eventId,
          author_id: authorId,
          comment: trimmed,
        })
        .select()
        .single()
      throwIfError(error)
      if (!saved) throw new Error("Could not save comment.")
      await refresh()
      return saved
    },
    [refresh]
  )

  const createUser = useCallback(
    async (input: CreateUserInput) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          email: input.email,
          role: input.role,
          password: input.password,
        }),
      })
      const payload = (await response.json()) as { error?: string; profile?: AppData["profiles"][number] }
      if (!response.ok || !payload.profile) {
        throw new Error(payload.error ?? "Could not create user.")
      }
      await refresh()
      return payload.profile
    },
    [refresh]
  )

  const updateUserRole = useCallback(
    async (userId: string, role: UserRole) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(payload.error ?? "Could not update role.")
      await refresh()
    },
    [refresh]
  )

  const setUserActive = useCallback(
    async (userId: string, isActive: boolean) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update user status.")
      }
      await refresh()
    },
    [refresh]
  )

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
