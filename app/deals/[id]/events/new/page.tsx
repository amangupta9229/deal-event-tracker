"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
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
import { useAppStore } from "@/lib/store/context"
import { PRIORITY_LABELS, type EventPriority } from "@/types"

export default function NewEventPage() {
  return (
    <AuthGuard>
      <AddEventForm />
    </AuthGuard>
  )
}

function AddEventForm() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { data, createEvent } = useAppStore()
  const deal = data.deals.find((item) => item.id === params.id)
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<EventPriority>("normal")
  const [error, setError] = useState<string | null>(null)

  if (!deal) {
    return (
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-muted-foreground">Deal not found.</p>
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
    try {
      await createEvent({
        dealId: deal.id,
        description: trimmed,
        priority,
        createdBy: user.id,
      })
      router.push(`/deals/${deal.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save event.")
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
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Add Event</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Log an important update against this deal.
      </p>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="deal">Deal</Label>
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
