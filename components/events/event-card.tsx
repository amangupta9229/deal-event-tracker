"use client"

import { useState } from "react"
import { AssigneeSelect } from "@/components/assignees/assignee-select"
import { CommentDialog } from "@/components/events/comment-dialog"
import { PriorityBadge } from "@/components/events/priority-badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/session"
import { notifyUserAssigned } from "@/lib/email/notify-assignment"
import { notifyComment } from "@/lib/email/notify-creator"
import { formatCompactDateTime } from "@/lib/format"
import {
  canAssign,
  canComment,
  canDeleteEvent,
  canResolveEvent,
} from "@/lib/permissions"
import { commentMailRecipients, getEventComments, profileName } from "@/lib/queries"
import { useAppStore } from "@/lib/store/context"
import { cn } from "@/lib/utils"
import { STATUS_LABELS, type DealEvent, type EventStatus } from "@/types"

const statusClass: Record<DealEvent["status"], string> = {
  open: "text-emerald-400",
  closed: "text-muted-foreground",
  na: "text-muted-foreground",
}

type PendingAction = Extract<EventStatus, "closed" | "na"> | "delete" | null

export function EventCard({ event }: { event: DealEvent }) {
  const { user } = useAuth()
  const { data, setEventStatus, setEventAssignee, addComment, deleteEvent } =
    useAppStore()
  const [commentOpen, setCommentOpen] = useState(false)
  const [pending, setPending] = useState<PendingAction>(null)
  const creator = data.profiles.find((profile) => profile.id === event.created_by)
  const deal = data.deals.find((item) => item.id === event.deal_id)
  const comments = getEventComments(data, event.id)
  const isOpen = event.status === "open"
  const canUserComment = !!user && canComment(user.role) && isOpen
  const canUserResolve = !!user && canResolveEvent(user.role) && isOpen
  const canChangeAssignee = !!user && canAssign(user.role)
  const canUserDelete = !!user && canDeleteEvent(user.role)

  async function handleComment(comment: string) {
    if (!user) return
    await addComment(event.id, user.id, comment)
    const recipients = commentMailRecipients(data, event, user.id)
    await notifyComment({
      to: recipients,
      dealName: deal?.name ?? "Order",
      eventDescription: event.description,
      comment,
      authorName: user.name,
      eventUrl: `${window.location.origin}/deals/${event.deal_id}#${event.id}`,
    })
  }

  async function handleConfirm() {
    if (!user || !pending) return
    if (pending === "delete") {
      await deleteEvent(event.id)
    } else {
      await setEventStatus(event.id, pending, user.id)
    }
    setPending(null)
  }

  const confirmCopy =
    pending === "closed"
      ? {
          title: "Mark this action done?",
          description: "It will be closed and no longer take comments.",
          confirmLabel: "Mark done",
          destructive: false,
        }
      : pending === "na"
        ? {
            title: "Mark this action NA?",
            description: "It will be closed as not applicable.",
            confirmLabel: "Mark NA",
            destructive: false,
          }
        : {
            title: "Delete this action?",
            description: "This cannot be undone. Comments on it will be removed too.",
            confirmLabel: "Delete",
            destructive: true,
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
          {event.status !== "open" && event.done_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              {STATUS_LABELS[event.status]} {formatCompactDateTime(event.done_at)}
              {event.done_by ? ` by ${profileName(data, event.done_by)}` : ""}
            </p>
          )}
          {comments.length > 0 && (
            <button
              type="button"
              className="mt-1 text-left text-xs text-muted-foreground hover:text-foreground hover:underline"
              onClick={() => setCommentOpen(true)}
            >
              {comments.length} {comments.length === 1 ? "comment" : "comments"} — open thread
            </button>
          )}
        </td>
        <td className="align-top px-3 py-2 text-xs text-foreground">
          {creator?.name ?? "Unknown"}
        </td>
        <td className="align-top whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
          {formatCompactDateTime(event.created_at)}
        </td>
        <td className="align-top px-3 py-2">
          {canChangeAssignee ? (
            <AssigneeSelect
              value={event.assigned_to}
              onChange={(next) => {
                if (next === event.assigned_to) return
                void (async () => {
                  await setEventAssignee(event.id, next)
                  if (!user) return
                  await notifyUserAssigned({
                    actorId: user.id,
                    actorName: user.name,
                    assignee: data.profiles.find((profile) => profile.id === next),
                    orderName: deal?.name ?? "Order",
                    actionDescription: event.description,
                    url: `${window.location.origin}/deals/${event.deal_id}#${event.id}`,
                    kind: "action",
                  })
                })()
              }}
            />
          ) : (
            <span className="text-xs">{profileName(data, event.assigned_to)}</span>
          )}
        </td>
        <td className="align-top px-3 py-2 text-right">
          {(canUserComment || canUserResolve || canUserDelete || !!user) && (
            <div className="flex flex-wrap justify-end gap-1">
              {user && (
                <Button size="sm" variant="outline" onClick={() => setCommentOpen(true)}>
                  {comments.length > 0 ? `Comments (${comments.length})` : "Comments"}
                </Button>
              )}
              {canUserResolve && (
                <>
                  <Button size="sm" onClick={() => setPending("closed")}>
                    Done
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPending("na")}
                  >
                    NA
                  </Button>
                </>
              )}
              {canUserDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setPending("delete")}
                >
                  Delete
                </Button>
              )}
            </div>
          )}
          {user && (
            <CommentDialog
              open={commentOpen}
              onOpenChange={setCommentOpen}
              onSubmit={handleComment}
              comments={comments}
              actionDescription={event.description}
              canReply={canUserComment}
            />
          )}
          <ConfirmDialog
            open={pending !== null}
            title={confirmCopy.title}
            description={confirmCopy.description}
            confirmLabel={confirmCopy.confirmLabel}
            destructive={confirmCopy.destructive}
            onOpenChange={(open) => {
              if (!open) setPending(null)
            }}
            onConfirm={handleConfirm}
          />
        </td>
      </tr>
  )
}
