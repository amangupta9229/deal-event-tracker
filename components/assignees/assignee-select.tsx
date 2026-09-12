"use client"

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
}: {
  value: string
  onChange: (userId: string) => void
  disabled?: boolean
  className?: string
}) {
  const { data } = useAppStore()
  const people = getAssignableProfiles(data)

  if (disabled) {
    return (
      <span className={cn("text-xs text-foreground", className)}>
        {profileName(data, value)}
      </span>
    )
  }

  return (
    <Select
      value={value || undefined}
      onValueChange={(next) => {
        if (next) onChange(next)
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
  )
}
