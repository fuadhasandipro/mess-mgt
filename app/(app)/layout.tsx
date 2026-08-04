import { ReactNode } from "react"
import Link from "next/link"
import { Home, Utensils, DollarSign, User, Users, ShieldCheck, Activity } from "lucide-react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { UserMenu } from "@/components/shared/user-menu"
import { redirect } from "next/navigation"
import { Toaster } from "@/components/ui/sonner"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ThemeToggle } from "@/components/shared/theme-toggle"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "MANAGER"

  return (
    <div className="flex h-screen flex-col md:flex-row bg-background">
      <Toaster />
      {/* Mobile Header */}
      <header className="flex items-center justify-between p-4 border-b md:hidden">
        <h1 className="font-semibold text-lg">Alpha</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu user={session.user as any} />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-muted/20">
        <div className="p-4 border-b flex items-center gap-3">
          <UserMenu user={session.user as any} />
          <div>
            <div className="font-semibold truncate w-40">{session.user.name || session.user.username}</div>
            <div className="text-xs text-muted-foreground">Alpha</div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted">
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/meals" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted">
            <Utensils className="h-5 w-5" />
            <span>Meals</span>
          </Link>
          <Link href="/finance" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted">
            <DollarSign className="h-5 w-5" />
            <span>Finance</span>
          </Link>
          {isAdmin && (
            <>
              <Link href="/members" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted">
                <Users className="h-5 w-5" />
                <span>Members</span>
              </Link>
              <Link href="/manager" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted">
                <ShieldCheck className="h-5 w-5" />
                <span>Manager</span>
              </Link>
            </>
          )}
          <Link href="/activity-log" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted">
            <Activity className="h-5 w-5" />
            <span>Activity Log</span>
          </Link>
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted">
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>
        </nav>
        <div className="p-4 border-t">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
        {children}
      </main>

      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
