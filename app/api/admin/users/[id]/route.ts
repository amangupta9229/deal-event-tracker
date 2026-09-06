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
