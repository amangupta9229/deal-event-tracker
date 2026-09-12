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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface CommentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (comment: string) => void | Promise<void>
}

export function CommentDialog({
  open,
  onOpenChange,
  onSubmit,
}: CommentDialogProps) {
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    const trimmed = comment.trim()
    if (!trimmed) {
      setError("A comment is required.")
      return
    }
    setSaving(true)
    try {
      await onSubmit(trimmed)
      setComment("")
      setError(null)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setComment("")
          setError(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add comment</DialogTitle>
          <DialogDescription>
            Comments are only allowed while the action is open. The creator,
            order assignee, and action assignee get an email.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="event-comment">Comment</Label>
          <Textarea
            id="event-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add an update or correction…"
            rows={4}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => void handleSubmit()}>
            Save comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
