import { cn } from "@/lib/utils"

export function DefproMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <svg
        aria-hidden
        viewBox="0 0 32 32"
        className="size-8 shrink-0"
      >
        <rect width="32" height="32" rx="6" className="fill-primary" />
        <path
          d="M10 7h7.4c4.6 0 7.6 2.6 7.6 6.8 0 4.2-3 6.8-7.6 6.8H14v4.4h-4V7zm4 10.2h3.2c2.2 0 3.6-1.3 3.6-3.4 0-2.1-1.4-3.4-3.6-3.4H14v6.8z"
          className="fill-primary-foreground"
        />
      </svg>
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-[0.14em] text-primary uppercase">
          Defpro Global
        </span>
        <span className="block text-[11px] text-muted-foreground">
          Deal Event Tracker
        </span>
      </span>
    </span>
  )
}
