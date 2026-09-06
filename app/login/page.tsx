"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DefproMark } from "@/components/brand/defpro-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { useAuth } from "@/lib/auth/session"

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@company.com" },
  { role: "Owner 1", email: "owner1@company.com" },
  { role: "Owner 2", email: "owner2@company.com" },
  { role: "Team", email: "rahul@company.com" },
]

export default function LoginPage() {
  const { hydrated, user, login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hydrated && user) router.replace("/deals")
  }, [hydrated, router, user])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = await login(email, password)
    if (result) {
      setError(result)
      return
    }
    router.push("/deals")
  }

  if (!hydrated || user) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <DefproMark />
        <h1 className="mt-6 text-xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal deal events for Defpro Global Pvt Ltd.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>

        {!isSupabaseConfigured() && (
          <div className="mt-6 rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Demo accounts (mock data)</p>
            <p className="mt-1">Password for all users: password</p>
            <ul className="mt-2 space-y-1">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  {account.role}: {account.email}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
