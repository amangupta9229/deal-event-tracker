"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { formatCompactDateTime } from "@/lib/format"
import { useAppStore } from "@/lib/store/context"
import { cn } from "@/lib/utils"
import type { EventComment } from "@/types"

export function CommentDialog({
  open,
  onOpenChange,
  onSubmit,
  comments,
  actionDescription,
  canReply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (comment: string) => void | Promise<void>
  comments: EventComment[]
  actionDescription: string
  canReply: boolean
}) {
  const { data } = useAppStore()
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [open, comments.length])

  async function handleSubmit() {
    const trimmed = comment.trim()
    if (!trimmed) {
      setError("Write a reply first.")
      return
    }
    setSaving(true)
    try {
      await onSubmit(trimmed)
      setComment("")
      setError(null)
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
      <DialogContent className="flex max-h-[min(720px,85vh)] w-full flex-col gap-3 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {actionDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-muted/20 p-3">
          {comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No comments yet.
            </p>
          ) : (
            <ol className="space-y-3">
              {comments.map((item) => {
                const author = data.profiles.find(
                  (profile) => profile.id === item.author_id
                )
                return (
                  <li key={item.id} className="rounded-lg bg-background p-3 ring-1 ring-border">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{author?.name ?? "Someone"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatCompactDateTime(item.created_at)}
                      </p>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {item.comment}
                    </p>
                  </li>
                )
              })}
            </ol>
          )}
          <div ref={bottomRef} />
        </div>
        {canReply ? (
          <div className="grid gap-2">
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Write a reply…"
              rows={3}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault()
                  void handleSubmit()
                }
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button disabled={saving} onClick={() => void handleSubmit()}>
                Send
              </Button>
            </div>
          </div>
        ) : (
          <p className={cn("text-xs text-muted-foreground")}>
            This action is closed, so new replies are off. You can still read the
            thread.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
