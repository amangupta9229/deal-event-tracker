"use client"

import Link from "next/link"
import { AuthGuard } from "@/components/layout/auth-guard"
import { CreateDealDialog } from "@/components/deals/create-deal-dialog"
import { MailStatsButton } from "@/components/deals/mail-stats-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/lib/auth/session"
import { formatRelativeActivity } from "@/lib/format"
import {
  countOpenEvents,
  countUrgentOpenEvents,
  getDealLastActivity,
} from "@/lib/queries"
import { useAppStore } from "@/lib/store/context"
import { canManageDeals, canSendStatsEmail } from "@/lib/permissions"

export default function DealsPage() {
  return (
    <AuthGuard>
      <DealsDashboard />
    </AuthGuard>
  )
}

function DealsDashboard() {
  const { user } = useAuth()
  const { data } = useAppStore()
  const deals = data.deals
    .filter((deal) => deal.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Deals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Defpro Global — open a deal to log supplier and negotiation updates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user && canSendStatsEmail(user.role) && <MailStatsButton />}
          {user && canManageDeals(user.role) && <CreateDealDialog />}
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No active deals yet.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead className="text-right">Open Events</TableHead>
                <TableHead className="text-right">Urgent</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => {
                const lastActivity = getDealLastActivity(data, deal.id)
                return (
                  <TableRow key={deal.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      <Link href={`/deals/${deal.id}`} className="hover:underline">
                        {deal.name}
                      </Link>
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
