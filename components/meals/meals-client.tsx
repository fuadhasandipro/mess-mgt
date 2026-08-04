"use client"

import { useState, useMemo, useEffect } from "react"
import { upsertMeal } from "@/lib/actions/meals"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, getDaysInMonth } from "date-fns"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

type User = { id: string; name: string; username: string; isActive: boolean }
type Meal = { id: string; userId: string; date: string; lunch: number; dinner: number }

import { ExportReportButton } from "@/components/shared/export-report-button"

export function MealsClient({
  initialUsers,
  initialMeals,
  month,
  year,
  currentUserRole,
}: {
  initialUsers: User[]
  initialMeals: Meal[]
  month: number
  year: number
  currentUserRole: string
}) {
  const router = useRouter()
  
  // Date stuff
  const daysInMonth = getDaysInMonth(new Date(year, month - 1))
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  
  // Set active day to current day if we're in the current month, else 1
  const now = new Date()
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear()
  const defaultDay = isCurrentMonth ? now.getDate() : 1
  const [activeDay, setActiveDay] = useState<number>(defaultDay)
  
  // Flatten initial meals into a fast lookup map: `${userId}_${date}` -> { l, d }
  const [mealsMap, setMealsMap] = useState<Record<string, { l: number; d: number }>>(() => {
    const map: Record<string, { l: number; d: number }> = {}
    initialMeals.forEach(m => {
      map[`${m.userId}_${m.date}`] = { l: m.lunch, d: m.dinner }
    })
    return map
  })

  // Update active day if default day changes (e.g. month switches)
  useEffect(() => {
    setActiveDay(isCurrentMonth ? now.getDate() : 1)
  }, [month, year])
  
  // Permissions: ADMIN acts as MANAGER but without month restrictions, or MANAGER can only edit current month
  // Since user asked "manager and admin has same access", let's let both edit anything just in case, but keep the month restriction if it was there.
  // Actually, wait, let's keep it simple: both ADMIN and MANAGER can edit.
  // The backend action `upsertMeal` restricts MANAGER to current month. We'll reflect that in UI.
  const isPastMonth = !isCurrentMonth
  const canEdit = currentUserRole === "ADMIN" || currentUserRole === "MANAGER"

  // Handlers
  const handleMonthChange = (offset: number) => {
    let newMonth = month + offset
    let newYear = year
    if (newMonth > 12) { newMonth = 1; newYear++ }
    else if (newMonth < 1) { newMonth = 12; newYear-- }
    router.push(`/meals?month=${newMonth}&year=${newYear}`)
  }

  const updateMeal = async (userId: string, day: number, field: "l" | "d", val: number) => {
    if (!canEdit) return
    const newCount = Math.max(0, Math.min(10, val)) // cap 0-10
    
    // YYYY-MM-DD
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const key = `${userId}_${dateStr}`
    const current = mealsMap[key] || { l: 0, d: 0 }
    if (current[field] === newCount) return
    
    const updated = { ...current, [field]: newCount }
    
    // Optimistic UI
    setMealsMap(prev => ({ ...prev, [key]: updated }))
    
    // Background save
    const res = await upsertMeal({
      userId,
      date: dateStr,
      lunch: updated.l,
      dinner: updated.d
    })
    
    if (res.error) {
      toast.error(res.error)
      // Revert optimism
      setMealsMap(prev => ({ ...prev, [key]: current }))
    } else {
      toast.success(`Saved meal for Day ${day}`, { duration: 1500 })
    }
  }

  // Derived calculations
  const calculateTotal = (l: number, d: number) => l + d
  
  const userTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    initialUsers.forEach(u => totals[u.id] = 0)
    
    Object.entries(mealsMap).forEach(([key, counts]) => {
      const userId = key.split("_")[0]
      if (totals[userId] !== undefined) {
        totals[userId] += calculateTotal(counts.l, counts.d)
      }
    })
    return totals
  }, [mealsMap, initialUsers])

  const messTotal = Object.values(userTotals).reduce((sum, t) => sum + t, 0)
  
  const dayTotals = useMemo(() => {
    const totals: Record<number, number> = {}
    daysArray.forEach(d => totals[d] = 0)
    
    Object.entries(mealsMap).forEach(([key, counts]) => {
      const day = parseInt(key.split("-")[2], 10)
      if (totals[day] !== undefined) {
        totals[day] += calculateTotal(counts.l, counts.d)
      }
    })
    return totals
  }, [mealsMap, daysArray])

  // Mini Stepper Component
  const Stepper = ({ val, onChange, label, disabled }: { val: number, onChange: (v: number) => void, label: string, disabled: boolean }) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</span>
      <div className="flex items-center border rounded-md overflow-hidden bg-background">
        <button 
          disabled={disabled || val <= 0} 
          onClick={() => onChange(val - 1)}
          className="px-2 py-1 bg-muted/30 hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
        <div className="w-6 text-center text-sm font-medium">{val}</div>
        <button 
          disabled={disabled || val >= 10} 
          onClick={() => onChange(val + 1)}
          className="px-2 py-1 bg-muted/30 hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  )

  const dateLabel = format(new Date(year, month - 1), "MMMM yyyy")

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Meals</h2>
            {["ADMIN", "MANAGER"].includes(currentUserRole) && (
              <ExportReportButton month={month} year={year} variant="outline" />
            )}
          </div>
          <div className="text-muted-foreground mt-1 flex items-center gap-2">
            Mess Total: <span className="font-bold text-foreground">{messTotal} meals</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleMonthChange(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium min-w-[120px] text-center">{dateLabel}</div>
          <Button variant="outline" size="icon" onClick={() => handleMonthChange(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!canEdit && (
        <div className="bg-muted text-muted-foreground text-sm p-3 rounded-md text-center">
          You are viewing in read-only mode. {currentUserRole === "MANAGER" ? "You cannot edit past months." : "Only Managers and Admins can edit meals."}
        </div>
      )}

      <Tabs defaultValue="day" className="w-full flex-1 flex flex-col">
        <div className="flex justify-center mb-4">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="day">Day View</TabsTrigger>
            <TabsTrigger value="month">Month View</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="day" className="mt-0 flex-1">
          <div className="flex flex-col space-y-4 h-full">
            {/* Date Selector */}
            <div className="flex items-center justify-between bg-card border rounded-md p-2 shadow-sm">
               <Button variant="ghost" size="icon" onClick={() => setActiveDay(prev => Math.max(1, prev - 1))} disabled={activeDay === 1}>
                 <ChevronLeft className="h-4 w-4"/>
               </Button>
               <span className="font-semibold text-sm">Day {activeDay}</span>
               <Button variant="ghost" size="icon" onClick={() => setActiveDay(prev => Math.min(daysInMonth, prev + 1))} disabled={activeDay === daysInMonth}>
                 <ChevronRight className="h-4 w-4"/>
               </Button>
            </div>

            {/* Selected Day Total */}
            <div className="bg-primary/10 border border-primary/20 p-3 rounded-md flex justify-between items-center shadow-sm">
              <span className="font-semibold">Day {activeDay} Total:</span>
              <span className="text-lg font-bold">{dayTotals[activeDay] || 0} meals</span>
            </div>

            {/* Users List for the Active Day */}
            <div className="flex-1 space-y-3 pb-20">
              {initialUsers.map(user => {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(activeDay).padStart(2, '0')}`
                const key = `${user.id}_${dateStr}`
                const counts = mealsMap[key] || { l: 0, d: 0 }
                const userDayTotal = calculateTotal(counts.l, counts.d)
                
                return (
                  <div key={user.id} className="border rounded-lg p-3 bg-card shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-semibold text-sm">{user.name} {!user.isActive && <span className="text-muted-foreground text-[10px]">(Inactive)</span>}</span>
                      <span className="text-sm font-medium text-muted-foreground">Total: {userDayTotal}</span>
                    </div>
                    <div className="flex justify-center gap-8 items-center">
                      <Stepper label="Lunch" val={counts.l} onChange={(v) => updateMeal(user.id, activeDay, "l", v)} disabled={!canEdit} />
                      <Stepper label="Dinner" val={counts.d} onChange={(v) => updateMeal(user.id, activeDay, "d", v)} disabled={!canEdit} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="month" className="mt-0">
          <div className="rounded-md border overflow-x-auto bg-card pb-4 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium sticky left-0 bg-muted/90 backdrop-blur z-20 min-w-[150px]">Member</th>
                  {daysArray.map(day => (
                    <th key={day} className="p-2 text-center font-medium min-w-[50px] whitespace-nowrap border-l">
                      {day}
                    </th>
                  ))}
                  <th className="p-3 text-right font-medium sticky right-0 bg-muted/90 backdrop-blur z-20 border-l">Total</th>
                </tr>
              </thead>
              <tbody>
                {initialUsers.map(user => (
                  <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium sticky left-0 bg-card z-10 border-r group-hover:bg-muted/30">
                      {user.name} {!user.isActive && <span className="text-[10px] text-muted-foreground ml-1">(Inactive)</span>}
                    </td>
                    {daysArray.map(day => {
                      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      const key = `${user.id}_${dateStr}`
                      const counts = mealsMap[key] || { l: 0, d: 0 }
                      const total = calculateTotal(counts.l, counts.d)
                      const hasMeals = total > 0

                      return (
                        <td key={day} className="p-1 border-l text-center">
                          <Popover>
                            <PopoverTrigger className={`w-full h-full min-h-[32px] rounded hover:bg-muted/80 flex flex-col items-center justify-center transition-colors ${hasMeals ? 'text-foreground font-medium' : 'text-muted-foreground/30'} outline-none`}>
                              {hasMeals ? total : "-"}
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3 shadow-lg" side="top">
                              <div className="flex gap-4">
                                <Stepper label="L" val={counts.l} onChange={(v) => updateMeal(user.id, day, "l", v)} disabled={!canEdit} />
                                <Stepper label="D" val={counts.d} onChange={(v) => updateMeal(user.id, day, "d", v)} disabled={!canEdit} />
                              </div>
                            </PopoverContent>
                          </Popover>
                        </td>
                      )
                    })}
                    <td className="p-3 text-right font-bold sticky right-0 bg-card z-10 border-l group-hover:bg-muted/30 text-primary">
                      {userTotals[user.id]}
                    </td>
                  </tr>
                ))}
                {/* Bottom Row Totals */}
                <tr className="bg-muted/20 font-bold border-t-2">
                  <td className="p-3 text-left sticky left-0 bg-muted/80 backdrop-blur z-20 border-r">Day Totals</td>
                  {daysArray.map(day => (
                    <td key={day} className="p-2 text-center border-l text-muted-foreground">
                      {dayTotals[day] > 0 ? dayTotals[day] : "-"}
                    </td>
                  ))}
                  <td className="p-3 text-right sticky right-0 bg-muted/80 backdrop-blur z-20 border-l text-primary text-lg">
                    {messTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
