"use client"

import { EventCard } from "@/components/events/event-card"
import { cn } from "@/lib/utils"
import type { DealEvent, EventStatus } from "@/types"

export type ActionStatusFilter = "all" | EventStatus

export function ActionsTable({
  events,
  emptyText,
}: {
  events: DealEvent[]
  emptyText: string
}) {
  return (
    <section className="overflow-x-auto rounded-lg border">
      {events.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        <table className="w-full table-fixed text-left">
          <colgroup>
            <col className="w-[108px]" />
            <col />
            <col className="w-[128px]" />
            <col className="w-[148px]" />
            <col className="w-[148px]" />
            <col className="w-[240px]" />
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
  )
}

export function StatusFilterButtons({
  value,
  counts,
  onChange,
}: {
  value: ActionStatusFilter
  counts: Record<ActionStatusFilter, number>
  onChange: (value: ActionStatusFilter) => void
}) {
  const items: { id: ActionStatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "closed", label: "Done" },
    { id: "na", label: "NA" },
  ]
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "rounded-lg border px-2.5 py-1 text-xs font-medium",
            value === item.id
              ? "border-foreground/20 bg-muted text-foreground"
              : "border-transparent text-muted-foreground hover:bg-muted/60"
          )}
        >
          {item.label} {counts[item.id]}
        </button>
      ))}
    </div>
  )
}
