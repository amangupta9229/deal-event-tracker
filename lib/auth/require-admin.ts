import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Profile } from "@/types"

export async function requireAdminProfile(): Promise<
  { profile: Profile } | { error: string; status: number }
> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized.", status: 401 }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || !profile.is_active) {
    return { error: "Unauthorized.", status: 401 }
  }
  if (profile.role !== "admin") {
    return { error: "Only admins can manage users.", status: 403 }
  }
  return { profile }
}
