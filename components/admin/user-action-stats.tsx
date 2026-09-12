"use client"

import { formatDurationMs } from "@/lib/format"
import { getUserActionStats } from "@/lib/queries"
import { useAppStore } from "@/lib/store/context"
import { PRIORITY_LABELS, PRIORITY_ORDER, ROLE_LABELS } from "@/types"

const BAR_COLOR: Record<string, string> = {
  urgent: "bg-red-500/80",
  high: "bg-orange-400/80",
  normal: "bg-sky-500/80",
  low: "bg-zinc-400/80",
}

export function UserActionStats() {
  const { data } = useAppStore()
  const stats = getUserActionStats(data)
  const maxPriority = Math.max(
    1,
    ...stats.flatMap((item) => Object.values(item.byPriority))
  )

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight">Team progress</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Done / NA actions closed by each owner and team member, with average time
        from create to close.
      </p>
      {stats.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No team members yet.</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {stats.map((item) => (
            <div key={item.profile.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{item.profile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[item.profile.role]}
                    {item.profile.is_active ? "" : " · Disabled"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.openAssigned} open assigned
                </p>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 px-2 py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Done
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums">{item.done}</dd>
                </div>
                <div className="rounded-lg bg-muted/50 px-2 py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    NA
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums">{item.na}</dd>
                </div>
                <div className="rounded-lg bg-muted/50 px-2 py-2">
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Avg time
                  </dt>
                  <dd className="text-sm font-semibold">
                    {item.avgMs === null ? "—" : formatDurationMs(item.avgMs)}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 space-y-1.5">
                {PRIORITY_ORDER.map((priority) => {
                  const count = item.byPriority[priority]
                  return (
                    <div key={priority} className="flex items-center gap-2 text-xs">
                      <span className="w-14 shrink-0 text-muted-foreground">
                        {PRIORITY_LABELS[priority]}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${BAR_COLOR[priority]}`}
                          style={{ width: `${(count / maxPriority) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right tabular-nums">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
