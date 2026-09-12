"use client"

import { useMemo, useState } from "react"
import {
  ActionsTable,
  StatusFilterButtons,
  type ActionStatusFilter,
} from "@/components/events/actions-table"
import { AuthGuard } from "@/components/layout/auth-guard"
import { MailStatsButton } from "@/components/deals/mail-stats-button"
import { useAuth } from "@/lib/auth/session"
import { sortOpenEventsByPriority, sortResolvedNewestFirst } from "@/lib/queries"
import { useAppStore } from "@/lib/store/context"
import { canSendStatsEmail } from "@/lib/permissions"

export default function PendingReviewsPage() {
  return (
    <AuthGuard roles={["admin", "owner"]}>
      <ActionsInbox />
    </AuthGuard>
  )
}

function ActionsInbox() {
  const { user } = useAuth()
  const { data } = useAppStore()
  const [filter, setFilter] = useState<ActionStatusFilter>("open")

  const events = useMemo(() => {
    const list =
      filter === "all"
        ? data.events
        : data.events.filter((event) => event.status === filter)
    if (filter === "open") return sortOpenEventsByPriority(list)
    if (filter === "closed" || filter === "na") return sortResolvedNewestFirst(list)
    return sortOpenEventsByPriority(list.filter((event) => event.status === "open")).concat(
      sortResolvedNewestFirst(list.filter((event) => event.status !== "open"))
    )
  }, [data.events, filter])

  const counts = {
    all: data.events.length,
    open: data.events.filter((event) => event.status === "open").length,
    closed: data.events.filter((event) => event.status === "closed").length,
    na: data.events.filter((event) => event.status === "na").length,
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Actions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open, done, and NA actions for follow-up and progress tracking.
          </p>
        </div>
        {user && canSendStatsEmail(user.role) && <MailStatsButton />}
      </div>

      <div className="mt-4">
        <StatusFilterButtons value={filter} counts={counts} onChange={setFilter} />
      </div>
      <div className="mt-3">
        <ActionsTable events={events} emptyText="No actions in this view." />
      </div>
    </div>
  )
}
