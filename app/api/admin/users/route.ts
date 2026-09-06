import { NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/auth/require-admin"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import type { UserRole } from "@/types"

const ROLES: UserRole[] = ["admin", "owner", "team"]

export async function POST(request: Request) {
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

  const body = (await request.json()) as {
    name?: string
    email?: string
    role?: UserRole
    password?: string
  }

  const name = body.name?.trim() ?? ""
  const email = body.email?.trim().toLowerCase() ?? ""
  const role = body.role
  const password = body.password ?? ""

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 })
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 })
  }
  if (!role || !ROLES.includes(role)) {
    return NextResponse.json({ error: "A valid role is required." }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    )
  }

  const admin = createServiceRoleClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })
  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create user." },
      { status: 400 }
    )
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: profileError?.message ?? "User created but profile is missing." },
      { status: 500 }
    )
  }

  return NextResponse.json({ profile })
}
