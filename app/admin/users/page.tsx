"use client"

import { useState } from "react"
import { UserActionStats } from "@/components/admin/user-action-stats"
import { AuthGuard } from "@/components/layout/auth-guard"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { useAuth } from "@/lib/auth/session"
import { useAppStore } from "@/lib/store/context"
import { ROLE_LABELS, type UserRole } from "@/types"

export default function AdminUsersPage() {
  return (
    <AuthGuard roles={["admin"]}>
      <UserManagement />
    </AuthGuard>
  )
}

function UserManagement() {
  const { user } = useAuth()
  const { data, createUser, updateUserRole, setUserActive, deleteUser } = useAppStore()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("team")
  const [error, setError] = useState<string | null>(null)
  const supabaseEnabled = isSupabaseConfigured()

  function resetForm() {
    setName("")
    setEmail("")
    setPassword("")
    setRole("team")
    setError(null)
  }

  async function handleCreate() {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName) {
      setError("Name is required.")
      return
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("A valid email is required.")
      return
    }
    if (supabaseEnabled && password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (
      data.profiles.some((profile) => profile.email.toLowerCase() === trimmedEmail)
    ) {
      setError("A user with that email already exists.")
      return
    }
    try {
      await createUser({
        name: trimmedName,
        email: trimmedEmail,
        role,
        password: supabaseEnabled ? password : undefined,
      })
      resetForm()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create user.")
    }
  }

  const users = [...data.profiles].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create users and assign roles. There is no public signup.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Create user</Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{profile.name}</TableCell>
                <TableCell>{profile.email}</TableCell>
                <TableCell>
                  <Select
                    value={profile.role}
                    onValueChange={(value) => {
                      if (value) updateUserRole(profile.id, value as UserRole)
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {ROLE_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {profile.is_active ? "Active" : "Disabled"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserActive(profile.id, !profile.is_active)}
                    >
                      {profile.is_active ? "Disable" : "Enable"}
                    </Button>
                    {user?.id !== profile.id && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(profile.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>
              {supabaseEnabled
                ? "The user will sign in with the email and password you set. There is no public signup."
                : "The user can sign in with the demo password until real auth is connected."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {supabaseEnabled && (
              <div className="grid gap-2">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(value) => {
                  if (value) setRole(value as UserRole)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {ROLE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete this user?"
        description="They will lose access. Their orders and actions stay, reassigned to another team member. This cannot be undone."
        confirmLabel="Delete user"
        destructive
        onOpenChange={(next) => {
          if (!next) setDeleteId(null)
        }}
        onConfirm={async () => {
          if (!deleteId) return
          await deleteUser(deleteId)
          setDeleteId(null)
        }}
      />
      <UserActionStats />
    </div>
  )
}
