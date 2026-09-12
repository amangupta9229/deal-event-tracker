"use client"

import { AuthProvider } from "@/lib/auth/session"
import { ToastHost } from "@/components/ui/toast-host"
import { MockStoreProvider } from "@/lib/mock/store"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { SupabaseStoreProvider } from "@/lib/store/supabase-store"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured()) {
    return (
      <AuthProvider>
        <SupabaseStoreProvider>
          {children}
          <ToastHost />
        </SupabaseStoreProvider>
      </AuthProvider>
    )
  }

  return (
    <MockStoreProvider>
      <AuthProvider>
        {children}
        <ToastHost />
      </AuthProvider>
    </MockStoreProvider>
  )
}
