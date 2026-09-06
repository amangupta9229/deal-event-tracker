"use client"

import { CommentDialog } from "@/components/events/comment-dialog"
import { PriorityBadge } from "@/components/events/priority-badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/session"
import { notifyComment } from "@/lib/email/notify-creator"
import { formatCompactDateTime } from "@/lib/format"
import { canComment, canResolveEvent } from "@/lib/permissions"
import { commentMailRecipients, getEventComments } from "@/lib/queries"
import { useAppStore } from "@/lib/store/context"
import { cn } from "@/lib/utils"
import { STATUS_LABELS, type DealEvent } from "@/types"
import { useState } from "react"

const statusClass: Record<DealEvent["status"], string> = {
  open: "text-emerald-400",
  closed: "text-muted-foreground",
  na: "text-muted-foreground",
}

export function EventCard({ event }: { event: DealEvent }) {
  const { user } = useAuth()
  const { data, setEventStatus, addComment } = useAppStore()
  const [commentOpen, setCommentOpen] = useState(false)
  const creator = data.profiles.find((profile) => profile.id === event.created_by)
  const deal = data.deals.find((item) => item.id === event.deal_id)
  const comments = getEventComments(data, event.id)
  const isOpen = event.status === "open"
  const canUserComment = !!user && canComment(user.role) && isOpen
  const canUserResolve = !!user && canResolveEvent(user.role) && isOpen

  async function handleComment(comment: string) {
    if (!user) return
    await addComment(event.id, user.id, comment)
    const recipients = commentMailRecipients(data, event, user.id)
    await notifyComment({
      to: recipients,
      dealName: deal?.name ?? "Deal",
      eventDescription: event.description,
      comment,
      authorName: user.name,
      eventUrl: `${window.location.origin}/deals/${event.deal_id}#${event.id}`,
    })
  }

  return (
    <tr
        id={event.id}
        className={cn(
          "border-b border-border/70",
          isOpen ? "bg-card" : "bg-muted/15 text-muted-foreground"
        )}
      >
        <td className="align-top px-3 py-2">
          <PriorityBadge priority={event.priority} />
          <p
            className={cn(
              "mt-1 text-[10px] font-semibold tracking-wide uppercase",
              statusClass[event.status]
            )}
          >
            {STATUS_LABELS[event.status]}
          </p>
        </td>
        <td className="align-top min-w-0 px-3 py-2">
          <p className="text-sm leading-snug text-foreground">{event.description}</p>
          {comments.length > 0 && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {comments
                .map((item) => {
                  const author = data.profiles.find(
                    (profile) => profile.id === item.author_id
                  )
                  return `${author?.name ?? "Someone"}: “${item.comment}”`
                })
                .join(" · ")}
            </p>
          )}
        </td>
        <td className="align-top px-3 py-2 text-xs text-foreground">
          {creator?.name ?? "Unknown"}
        </td>
        <td className="align-top whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
          {formatCompactDateTime(event.created_at)}
        </td>
        <td className="align-top px-3 py-2 text-right">
          {isOpen && (canUserComment || canUserResolve) ? (
            <div className="flex flex-wrap justify-end gap-1">
              {canUserComment && (
                <Button size="sm" variant="outline" onClick={() => setCommentOpen(true)}>
                  Comment
                </Button>
              )}
              {canUserResolve && (
                <>
                  <Button
                    size="sm"
                    onClick={() => void setEventStatus(event.id, "closed", user.id)}
                  >
                    Done
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void setEventStatus(event.id, "na", user.id)}
                  >
                    NA
                  </Button>
                </>
              )}
            </div>
          ) : null}
          {user && (
            <CommentDialog
              open={commentOpen}
              onOpenChange={setCommentOpen}
              onSubmit={handleComment}
            />
          )}
        </td>
      </tr>
  )
}
