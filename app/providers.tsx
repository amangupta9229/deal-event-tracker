"use client"

import { AuthProvider } from "@/lib/auth/session"
import { MockStoreProvider } from "@/lib/mock/store"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { SupabaseStoreProvider } from "@/lib/store/supabase-store"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured()) {
    return (
      <AuthProvider>
        <SupabaseStoreProvider>{children}</SupabaseStoreProvider>
      </AuthProvider>
    )
  }

  return (
    <MockStoreProvider>
      <AuthProvider>{children}</AuthProvider>
    </MockStoreProvider>
  )
}
