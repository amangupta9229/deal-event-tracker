"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { AppStoreValue } from "@/lib/store/types"

const AppStoreContext = createContext<AppStoreValue | null>(null)

export function AppStoreProvider({
  value,
  children,
}: {
  value: AppStoreValue
  children: ReactNode
}) {
  return (
    <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
  )
}

export function useAppStore() {
  const context = useContext(AppStoreContext)
  if (!context) {
    throw new Error("useAppStore must be used within an AppStoreProvider")
  }
  return context
}
