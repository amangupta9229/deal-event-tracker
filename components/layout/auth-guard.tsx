"use client"

import { useAuth } from "@/lib/auth/session"
import { useAppStore } from "@/lib/store/context"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { AppShell } from "@/components/layout/app-shell"
import type { UserRole } from "@/types"

export function AuthGuard({
  children,
  roles,
}: {
  children: ReactNode
  roles?: UserRole[]
}) {
  const { hydrated, user } = useAuth()
  const { hydrated: storeHydrated } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (roles && !roles.includes(user.role)) {
      router.replace("/deals")
    }
  }, [hydrated, roles, router, user])

  if (!hydrated || (user && !storeHydrated)) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!user) return null
  if (roles && !roles.includes(user.role)) return null

  return <AppShell>{children}</AppShell>
}
