"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AssigneeSelect } from "@/components/assignees/assignee-select"
import { notifyUserAssigned } from "@/lib/email/notify-assignment"
import { useAuth } from "@/lib/auth/session"
import { getAssignableProfiles } from "@/lib/queries"
import { useAppStore } from "@/lib/store/context"

export function CreateDealDialog() {
  const { user } = useAuth()
  const { data, createDeal } = useAppStore()
  const people = getAssignableProfiles(data)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [assignedTo, setAssignedTo] = useState(people[0]?.id ?? "")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!user) return
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Order name is required.")
      return
    }
    if (!assignedTo) {
      setError("Assigned to is required.")
      return
    }
    try {
      const deal = await createDeal({
        name: trimmed,
        createdBy: user.id,
        assignedTo,
      })
      await notifyUserAssigned({
        actorId: user.id,
        actorName: user.name,
        assignee: data.profiles.find((profile) => profile.id === assignedTo),
        orderName: deal.name,
        url: `${window.location.origin}/deals/${deal.id}`,
        kind: "order",
      })
      setName("")
      setAssignedTo(people[0]?.id ?? "")
      setError(null)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create order.")
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create order</Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setName("")
            setError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create order</DialogTitle>
            <DialogDescription>
              An order is a named container for actions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="deal-name">Name</Label>
              <Input
                id="deal-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Silica Gel – AIIMS"
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleSubmit()
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Assigned to</Label>
              <AssigneeSelect
                requireConfirm={false}
                value={assignedTo}
                onChange={setAssignedTo}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
