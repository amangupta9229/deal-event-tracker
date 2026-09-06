import { createClient } from "@supabase/supabase-js"
import {
  requireServiceRoleKey,
  requireSupabasePublicEnv,
} from "@/lib/supabase/env"
import type { Database } from "@/types/database"

export function createServiceRoleClient() {
  const { url } = requireSupabasePublicEnv()
  return createClient<Database>(url, requireServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
