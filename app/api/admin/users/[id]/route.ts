import { NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/auth/require-admin"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import type { UserRole } from "@/types"

const ROLES: UserRole[] = ["admin", "owner", "team"]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 400 }
    )
  }

  const auth = await requireAdminProfile()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = (await request.json()) as {
    role?: UserRole
    is_active?: boolean
  }

  const patch: { role?: UserRole; is_active?: boolean } = {}
  if (body.role) {
    if (!ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 })
    }
    patch.role = body.role
  }
  if (typeof body.is_active === "boolean") {
    patch.is_active = body.is_active
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 })
  }

  const admin = createServiceRoleClient()
  const { data: profile, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ profile })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 400 }
    )
  }

  const auth = await requireAdminProfile()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  if (id === auth.profile.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    )
  }

  const admin = createServiceRoleClient()
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, role, is_active")
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 400 })
  }

  const remainingAdmins = (profiles ?? []).filter(
    (profile) => profile.id !== id && profile.role === "admin" && profile.is_active
  )
  const target = (profiles ?? []).find((profile) => profile.id === id)
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }
  if (target.role === "admin" && remainingAdmins.length === 0) {
    return NextResponse.json(
      { error: "Cannot delete the last admin." },
      { status: 400 }
    )
  }

  const fallback =
    (profiles ?? []).find(
      (profile) =>
        profile.id !== id &&
        profile.is_active &&
        (profile.role === "owner" || profile.role === "team")
    )?.id ?? auth.profile.id

  const updates = await Promise.all([
    admin.from("deals").update({ assigned_to: fallback }).eq("assigned_to", id),
    admin.from("deals").update({ created_by: fallback }).eq("created_by", id),
    admin.from("events").update({ assigned_to: fallback }).eq("assigned_to", id),
    admin.from("events").update({ created_by: fallback }).eq("created_by", id),
    admin.from("events").update({ done_by: fallback }).eq("done_by", id),
    admin.from("event_comments").update({ author_id: fallback }).eq("author_id", id),
  ])
  const failed = updates.find((item) => item.error)
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 400 })
  }

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
