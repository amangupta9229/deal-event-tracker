"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Briefcase, Inbox, LogOut, Menu, Users } from "lucide-react"
import { DefproMark } from "@/components/brand/defpro-mark"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth/session"
import { canManageUsers, canSeeOpenEventsInbox } from "@/lib/permissions"
import { ROLE_LABELS } from "@/types"
import { cn } from "@/lib/utils"
import { useState, type ReactNode } from "react"

function NavLinks({
  onNavigate,
}: {
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const { user } = useAuth()
  if (!user) return null

  const items = [
    { href: "/deals", label: "Deals", icon: Briefcase, show: true },
    {
      href: "/pending-reviews",
      label: "Open Events",
      icon: Inbox,
      show: canSeeOpenEventsInbox(user.role),
    },
    {
      href: "/admin/users",
      label: "User Management",
      icon: Users,
      show: canManageUsers(user.role),
    },
  ].filter((item) => item.show)

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function UserFooter() {
  const { user, logout } = useAuth()
  const router = useRouter()
  if (!user) return null

  return (
    <div className="mt-auto space-y-3">
      <Separator />
      <div>
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          void logout().then(() => router.push("/login"))
        }}
      >
        <LogOut className="size-4" />
        Log out
      </Button>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar p-4 md:flex md:flex-col">
        <div className="mb-6 px-1">
          <DefproMark />
        </div>
        <NavLinks />
        <UserFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon-sm" aria-label="Open menu" />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <SheetHeader>
                <SheetTitle>
                  <DefproMark />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex h-[calc(100%-3rem)] flex-col">
                <NavLinks onNavigate={() => setOpen(false)} />
                <UserFooter />
              </div>
            </SheetContent>
          </Sheet>
          <DefproMark />
        </header>
        <main className="flex-1 p-3 md:p-5">{children}</main>
      </div>
    </div>
  )
}
