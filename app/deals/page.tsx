"use client"

import Link from "next/link"
import { AuthGuard } from "@/components/layout/auth-guard"
import { CreateDealDialog } from "@/components/deals/create-deal-dialog"
import { MailStatsButton } from "@/components/deals/mail-stats-button"
import { AssigneeSelect } from "@/components/assignees/assignee-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/lib/auth/session"
import { notifyUserAssigned } from "@/lib/email/notify-assignment"
import { formatRelativeActivity } from "@/lib/format"
import {
  countOpenEvents,
  countUrgentOpenEvents,
  getDealLastActivity,
  profileName,
} from "@/lib/queries"
import { useAppStore } from "@/lib/store/context"
import { canAssign, canManageDeals, canSendStatsEmail } from "@/lib/permissions"

export default function DealsPage() {
  return (
    <AuthGuard>
      <OrdersDashboard />
    </AuthGuard>
  )
}

function OrdersDashboard() {
  const { user } = useAuth()
  const { data, setDealAssignee } = useAppStore()
  const deals = data.deals
    .filter((deal) => deal.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Defpro Global — open an order to log actions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user && canSendStatsEmail(user.role) && <MailStatsButton />}
          {user && canManageDeals(user.role) && <CreateDealDialog />}
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No active orders yet.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead className="text-right">Open actions</TableHead>
                <TableHead className="text-right">Urgent</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => {
                const lastActivity = getDealLastActivity(data, deal.id)
                const canChange = !!user && canAssign(user.role)
                return (
                  <TableRow key={deal.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      <Link href={`/deals/${deal.id}`} className="hover:underline">
                        {deal.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {canChange ? (
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
                                assignee: data.profiles.find(
                                  (profile) => profile.id === next
                                ),
                                orderName: deal.name,
                                url: `${window.location.origin}/deals/${deal.id}`,
                                kind: "order",
                              })
                            })()
                          }}
                        />
                      ) : (
                        <span className="text-sm">
                          {profileName(data, deal.assigned_to)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {countOpenEvents(data, deal.id)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {countUrgentOpenEvents(data, deal.id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeActivity(lastActivity)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
