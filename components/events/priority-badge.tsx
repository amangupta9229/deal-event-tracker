import { cn } from "@/lib/utils"
import { PRIORITY_LABELS, type EventPriority } from "@/types"

const styles: Record<EventPriority, string> = {
  urgent: "border-red-500/40 bg-red-500/15 text-red-300",
  high: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  normal: "border-primary/30 bg-primary/10 text-primary",
  low: "border-border bg-muted text-muted-foreground",
}

export function PriorityBadge({ priority }: { priority: EventPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide uppercase",
        styles[priority]
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
