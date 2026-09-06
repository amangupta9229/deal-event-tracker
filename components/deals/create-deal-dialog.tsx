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
import { useAuth } from "@/lib/auth/session"
import { useAppStore } from "@/lib/store/context"

export function CreateDealDialog() {
  const { user } = useAuth()
  const { createDeal } = useAppStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!user) return
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Deal name is required.")
      return
    }
    try {
      await createDeal({ name: trimmed, createdBy: user.id })
      setName("")
      setError(null)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create deal.")
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create Deal</Button>
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
            <DialogTitle>Create deal</DialogTitle>
            <DialogDescription>
              A deal is a named container for events.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="deal-name">Name</Label>
            <Input
              id="deal-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Silica Gel – AIIMS"
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSubmit()
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
