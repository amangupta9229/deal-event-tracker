"use client"

import { useAuth } from "@/lib/auth/session"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const { hydrated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return
    router.replace(user ? "/deals" : "/login")
  }, [hydrated, router, user])

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  )
}
