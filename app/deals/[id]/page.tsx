"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AssigneeSelect } from "@/components/assignees/assignee-select"
import {
  ActionsTable,
  StatusFilterButtons,
  type ActionStatusFilter,
} from "@/components/events/actions-table"
import { AuthGuard } from "@/components/layout/auth-guard"
import { MailStatsButton } from "@/components/deals/mail-stats-button"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useAuth } from "@/lib/auth/session"
import { notifyUserAssigned } from "@/lib/email/notify-assignment"
import { useAppStore } from "@/lib/store/context"
import { profileName, sortEventsNewestFirst, sortResolvedNewestFirst } from "@/lib/queries"
import {
  canAssign,
  canDeleteDeal,
  canManageDeals,
  canSendStatsEmail,
} from "@/lib/permissions"

export default function DealDetailPage() {
  return (
    <AuthGuard>
      <OrderDetail />
    </AuthGuard>
  )
}

function OrderDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { data, updateDealStatus, setDealAssignee, deleteDeal } = useAppStore()
  const [filter, setFilter] = useState<ActionStatusFilter>("all")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deal = data.deals.find((item) => item.id === params.id)
  const allEvents = useMemo(
    () =>
      sortEventsNewestFirst(
        data.events.filter((event) => event.deal_id === params.id)
      ),
    [data.events, params.id]
  )
  const events = useMemo(() => {
    const filtered =
      filter === "all" ? allEvents : allEvents.filter((event) => event.status === filter)
    if (filter === "closed" || filter === "na") return sortResolvedNewestFirst(filtered)
    return filtered
  }, [allEvents, filter])

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
  const counts = {
    all: allEvents.length,
    open: allEvents.filter((event) => event.status === "open").length,
    closed: allEvents.filter((event) => event.status === "closed").length,
    na: allEvents.filter((event) => event.status === "na").length,
  }

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
                confirmKind="order"
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
          {user && canDeleteDeal(user.role) && (
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              Delete order
            </Button>
          )}
          <Button nativeButton={false} render={<Link href={`/deals/${deal.id}/events/new`} />}>
            Add action
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <StatusFilterButtons value={filter} counts={counts} onChange={setFilter} />
      </div>
      <div className="mt-3">
        <ActionsTable events={events} emptyText="No actions in this view." />
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this order?"
        description="All actions and comments on it will be removed. This cannot be undone."
        confirmLabel="Delete order"
        destructive
        onOpenChange={setConfirmDelete}
        onConfirm={async () => {
          await deleteDeal(deal.id)
          router.push("/deals")
        }}
      />
    </div>
  )
}
