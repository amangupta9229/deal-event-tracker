"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AssigneeSelect } from "@/components/assignees/assignee-select"
import { AuthGuard } from "@/components/layout/auth-guard"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth/session"
import { notifyUserAssigned } from "@/lib/email/notify-assignment"
import { canAssign } from "@/lib/permissions"
import { defaultActionAssignee, profileName } from "@/lib/queries"
import { useAppStore } from "@/lib/store/context"
import { PRIORITY_LABELS, type EventPriority } from "@/types"

export default function NewEventPage() {
  return (
    <AuthGuard>
      <AddActionForm />
    </AuthGuard>
  )
}

function AddActionForm() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { data, createEvent } = useAppStore()
  const deal = data.deals.find((item) => item.id === params.id)
  const inheritedAssignee = useMemo(
    () =>
      deal && user
        ? defaultActionAssignee(data, deal.assigned_to, user.id)
        : "",
    [data, deal, user]
  )
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<EventPriority>("normal")
  const [assignedTo, setAssignedTo] = useState(inheritedAssignee)
  const [error, setError] = useState<string | null>(null)
  const canPickAssignee = !!user && canAssign(user.role)
  const assigneeId = canPickAssignee ? assignedTo || inheritedAssignee : inheritedAssignee

  useEffect(() => {
    if (!assignedTo && inheritedAssignee) setAssignedTo(inheritedAssignee)
  }, [assignedTo, inheritedAssignee])

  if (!deal) {
    return (
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-muted-foreground">Order not found.</p>
      </div>
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!user || !deal) return
    const trimmed = description.trim()
    if (!trimmed) {
      setError("Description is required.")
      return
    }
    if (!assigneeId) {
      setError("Assigned to is required.")
      return
    }
    try {
      const saved = await createEvent({
        dealId: deal.id,
        description: trimmed,
        priority,
        createdBy: user.id,
        assignedTo: assigneeId,
      })
      await notifyUserAssigned({
        actorId: user.id,
        actorName: user.name,
        assignee: data.profiles.find((profile) => profile.id === assigneeId),
        orderName: deal.name,
        actionDescription: saved.description,
        url: `${window.location.origin}/deals/${deal.id}#${saved.id}`,
        kind: "action",
      })
      router.push(`/deals/${deal.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save action.")
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href={`/deals/${deal.id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {deal.name}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Add action</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Log an important update against this order.
      </p>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="deal">Order</Label>
          <InputLocked value={deal.name} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            required
            rows={6}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Supplier informed us that the material may become stale within 4 days."
          />
        </div>
        <div className="grid gap-2">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(value) => {
              if (value) setPriority(value as EventPriority)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PRIORITY_LABELS) as EventPriority[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {PRIORITY_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Assigned to</Label>
          {canPickAssignee ? (
            <AssigneeSelect
              className="w-full"
              value={assigneeId}
              onChange={setAssignedTo}
            />
          ) : (
            <p className="text-sm">{profileName(data, assigneeId)}</p>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button
            type="button"
            variant="outline"
            render={<Link href={`/deals/${deal.id}`} />}
            nativeButton={false}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

function InputLocked({ value }: { value: string }) {
  return (
    <input
      id="deal"
      readOnly
      value={value}
      className="h-8 w-full rounded-lg border border-input bg-muted px-2.5 text-sm text-muted-foreground"
    />
  )
}
