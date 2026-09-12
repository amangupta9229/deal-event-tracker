"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect } from "react"
import { AssigneeSelect } from "@/components/assignees/assignee-select"
import { AuthGuard } from "@/components/layout/auth-guard"
import { MailStatsButton } from "@/components/deals/mail-stats-button"
import { EventCard } from "@/components/events/event-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/session"
import { notifyUserAssigned } from "@/lib/email/notify-assignment"
import { useAppStore } from "@/lib/store/context"
import { profileName, sortEventsNewestFirst } from "@/lib/queries"
import { canAssign, canManageDeals, canSendStatsEmail } from "@/lib/permissions"

export default function DealDetailPage() {
  return (
    <AuthGuard>
      <OrderDetail />
    </AuthGuard>
  )
}

function OrderDetail() {
  const params = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data, updateDealStatus, setDealAssignee } = useAppStore()
  const deal = data.deals.find((item) => item.id === params.id)
  const events = sortEventsNewestFirst(
    data.events.filter((event) => event.deal_id === params.id)
  )

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (!hash) return
    document.getElementById(hash)?.scrollIntoView({ block: "start" })
  }, [events])

  if (!deal) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Button variant="link" nativeButton={false} render={<Link href="/deals" />}>
          Back to orders
        </Button>
      </div>
    )
  }

  const canChangeAssignee = !!user && canAssign(user.role)

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/deals"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{deal.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Status: {deal.status === "active" ? "Active" : "Archived"}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Assigned to</span>
            {canChangeAssignee ? (
              <AssigneeSelect
                value={deal.assigned_to}
                onChange={(next) => {
                  if (next === deal.assigned_to) return
                  void (async () => {
                    await setDealAssignee(deal.id, next)
                    if (!user) return
                    await notifyUserAssigned({
                      actorId: user.id,
                      actorName: user.name,
                      assignee: data.profiles.find((profile) => profile.id === next),
                      orderName: deal.name,
                      url: `${window.location.origin}/deals/${deal.id}`,
                      kind: "order",
                    })
                  })()
                }}
              />
            ) : (
              <span>{profileName(data, deal.assigned_to)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {user && canSendStatsEmail(user.role) && <MailStatsButton />}
          {user && canManageDeals(user.role) && (
            <Button
              variant="outline"
              onClick={() => {
                void updateDealStatus(
                  deal.id,
                  deal.status === "active" ? "archived" : "active"
                )
              }}
            >
              {deal.status === "active" ? "Archive" : "Unarchive"}
            </Button>
          )}
          <Button nativeButton={false} render={<Link href={`/deals/${deal.id}/events/new`} />}>
            Add action
          </Button>
        </div>
      </div>

      <section className="mt-4 overflow-x-auto rounded-lg border">
        {events.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No actions yet. Add the first update for this order.
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
