"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { DEMO_PASSWORD, SESSION_STORAGE_KEY } from "@/lib/auth/constants"
import { clearSessionTimers, markSessionFresh, useSessionTimeout } from "@/lib/auth/session-timeout"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useAppStore } from "@/lib/store/context"
import type { Profile } from "@/types"

interface AuthValue {
  hydrated: boolean
  user: Profile | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

function MockAuthProvider({ children }: { children: ReactNode }) {
  const { data, hydrated: storeHydrated } = useAppStore()
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionHydrated, setSessionHydrated] = useState(false)

  useEffect(() => {
    const storedId = window.localStorage.getItem(SESSION_STORAGE_KEY)
    queueMicrotask(() => {
      setUserId(storedId)
      setSessionHydrated(true)
    })
  }, [])

  const user = useMemo(() => {
    if (!userId) return null
    const profile = data.profiles.find((item) => item.id === userId)
    if (!profile || !profile.is_active) return null
    return profile
  }, [data.profiles, userId])

  const login = useCallback(
    async (email: string, password: string) => {
      const normalized = email.trim().toLowerCase()
      const profile = data.profiles.find(
        (item) => item.email.toLowerCase() === normalized
      )
      if (!profile) return "No account found for that email."
      if (!profile.is_active) return "This account is disabled."
      if (password !== DEMO_PASSWORD) return "Incorrect password."
      window.localStorage.setItem(SESSION_STORAGE_KEY, profile.id)
      markSessionFresh()
      setUserId(profile.id)
      return null
    },
    [data.profiles]
  )

  const logout = useCallback(async () => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    clearSessionTimers()
    setUserId(null)
  }, [])

  useSessionTimeout(!!user, logout)

  const value = useMemo(
    () => ({
      hydrated: storeHydrated && sessionHydrated,
      user,
      login,
      logout,
    }),
    [login, logout, sessionHydrated, storeHydrated, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const loadProfile = useCallback(async () => {
    const supabase = createBrowserSupabaseClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) {
      setUser(null)
      setHydrated(true)
      return
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle()
    if (!profile || !profile.is_active) {
      await supabase.auth.signOut()
      setUser(null)
      setHydrated(true)
      return
    }
    setUser(profile)
    setHydrated(true)
  }, [])

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    queueMicrotask(() => {
      void loadProfile()
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadProfile()
    })
    return () => subscription.unsubscribe()
  }, [loadProfile])

  const login = useCallback(async (email: string, password: string) => {
    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) return error.message
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return "Could not sign in."
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle()
    if (!profile) {
      await supabase.auth.signOut()
      return "No profile found for this account."
    }
    if (!profile.is_active) {
      await supabase.auth.signOut()
      return "This account is disabled."
    }
    setUser(profile)
    markSessionFresh()
    return null
  }, [])

  const logout = useCallback(async () => {
    const supabase = createBrowserSupabaseClient()
    clearSessionTimers()
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  useSessionTimeout(!!user, logout)

  const value = useMemo(
    () => ({
      hydrated,
      user,
      login,
      logout,
    }),
    [hydrated, login, logout, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured()) {
    return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
  }
  return <MockAuthProvider>{children}</MockAuthProvider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
