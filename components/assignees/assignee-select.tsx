"use client"

import { useState } from "react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAssignableProfiles, profileName } from "@/lib/queries"
import { useAppStore } from "@/lib/store/context"
import { cn } from "@/lib/utils"

export function AssigneeSelect({
  value,
  onChange,
  disabled,
  className,
  confirmKind = "action",
  requireConfirm = true,
}: {
  value: string
  onChange: (userId: string) => void
  disabled?: boolean
  className?: string
  confirmKind?: "order" | "action"
  requireConfirm?: boolean
}) {
  const { data } = useAppStore()
  const people = getAssignableProfiles(data)
  const [pendingId, setPendingId] = useState<string | null>(null)

  if (disabled) {
    return (
      <span className={cn("text-xs text-foreground", className)}>
        {profileName(data, value)}
      </span>
    )
  }

  const pendingName = pendingId ? profileName(data, pendingId) : ""

  return (
    <>
      <Select
        value={value || undefined}
        onValueChange={(next) => {
          if (!next || next === value) return
          if (requireConfirm) setPendingId(next)
          else onChange(next)
        }}
      >
        <SelectTrigger
          className={cn("h-8 w-[148px] text-xs", className)}
          onClick={(event) => event.stopPropagation()}
        >
          <SelectValue placeholder="Assign…">{profileName(data, value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {people.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ConfirmDialog
        open={pendingId !== null}
        title="Change assignee?"
        description={`Assign this ${confirmKind} to ${pendingName}? They will get an email.`}
        confirmLabel="Assign"
        onOpenChange={(open) => {
          if (!open) setPendingId(null)
        }}
        onConfirm={() => {
          if (pendingId) onChange(pendingId)
          setPendingId(null)
        }}
      />
    </>
  )
}
