"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Utensils, DollarSign, User, Users, ShieldCheck, Activity, Menu } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

type MobileNavProps = {
  isAdmin: boolean
}

export function MobileNav({ isAdmin }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const tabs = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Meals", href: "/meals", icon: Utensils },
    { name: "Finance", href: "/finance", icon: DollarSign },
  ]

  if (!isAdmin) {
    tabs.push({ name: "Profile", href: "/profile", icon: User })
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex justify-around p-2 pb-safe z-50">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href)
        return (
          <Link 
            key={tab.name}
            href={tab.href} 
            className={`flex flex-col items-center p-2 min-w-14 transition-colors ${isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] mt-1">{tab.name}</span>
          </Link>
        )
      })}
      
      {isAdmin && (
        <>
          <button onClick={() => setOpen(true)} className="flex flex-col items-center p-2 min-w-14 text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-1">More</span>
          </button>
          
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Admin Options</DrawerTitle>
              </DrawerHeader>
              <div className="grid grid-cols-3 gap-4 p-4 pb-8">
                <Link href="/members" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-center">
                  <Users className="h-6 w-6" />
                  <span className="text-xs font-medium">Members</span>
                </Link>
                <Link href="/manager" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-center">
                  <ShieldCheck className="h-6 w-6" />
                  <span className="text-xs font-medium">Manager</span>
                </Link>
                <Link href="/activity-log" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-center">
                  <Activity className="h-6 w-6" />
                  <span className="text-xs font-medium">Log</span>
                </Link>
                <Link href="/profile" onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-center">
                  <User className="h-6 w-6" />
                  <span className="text-xs font-medium">Profile</span>
                </Link>
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </nav>
  )
}
