"use client"

import { AuthGuard } from "@/components/layout/auth-guard"
import { MailStatsButton } from "@/components/deals/mail-stats-button"
import { EventCard } from "@/components/events/event-card"
import { useAuth } from "@/lib/auth/session"
import { sortOpenEventsByPriority } from "@/lib/queries"
import { useAppStore } from "@/lib/store/context"
import { canSendStatsEmail } from "@/lib/permissions"

export default function PendingReviewsPage() {
  return (
    <AuthGuard roles={["admin", "owner"]}>
      <OpenActions />
    </AuthGuard>
  )
}

function OpenActions() {
  const { user } = useAuth()
  const { data } = useAppStore()
  const events = sortOpenEventsByPriority(
    data.events.filter((event) => event.status === "open")
  )

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Open actions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open actions, urgent first, oldest first within a priority.
          </p>
        </div>
        {user && canSendStatsEmail(user.role) && <MailStatsButton />}
      </div>

      <section className="mt-4 overflow-x-auto rounded-lg border">
        {events.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            There are no open actions.
          </div>
        ) : (
          <table className="w-full table-fixed text-left">
            <colgroup>
              <col className="w-[108px]" />
              <col />
              <col className="w-[128px]" />
              <col className="w-[148px]" />
              <col className="w-[148px]" />
              <col className="w-[200px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/30 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Created by</th>
                <th className="px-3 py-2 font-medium">Created at</th>
                <th className="px-3 py-2 font-medium">Assigned to</th>
                <th className="px-3 py-2 text-right font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
