"use client"

import { useState } from "react"
import { addDeposit, deleteDeposit, addExpense, deleteExpense } from "@/lib/actions/finance"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2, Wallet, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"

import { ExportReportButton } from "@/components/shared/export-report-button"

type User = { id: string; name: string }
type Deposit = {
  id: string
  userId: string
  amount: number
  date: string
  note: string | null
  user: { name: string }
  recordedBy: { name: string }
}
type Expense = {
  id: string
  amount: number
  category: string
  date: string
  note: string | null
  recordedBy: { name: string }
}

type MonthSummary = {
  mealRate: number
  totalExpense: number
  totalMeals: number
  totalDeposits: number
  memberSummaries: {
    userId: string
    name: string
    isActive: boolean
    meals: number
    cost: number
    paid: number
    due: number
  }[]
}

export function FinanceClient({
  initialDeposits,
  initialExpenses,
  activeUsers,
  monthSummary,
  month,
  year,
  currentUserRole,
  currentUserId,
}: {
  initialDeposits: Deposit[]
  initialExpenses: Expense[]
  activeUsers: User[]
  monthSummary: MonthSummary
  month: number
  year: number
  currentUserRole: string
  currentUserId: string
}) {
  const router = useRouter()
  
  // Local state for optimistic updates
  const [deposits, setDeposits] = useState(initialDeposits)
  const [expenses, setExpenses] = useState(initialExpenses)

  const [isLoading, setIsLoading] = useState(false)
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isExpenseOpen, setIsExpenseOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "deposit"|"expense", id: string } | null>(null)

  // Forms
  // Use locale-aware date to get today in the user's browser timezone (Bangladesh), not UTC
  const todayStr = (() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  })()
  const [depForm, setDepForm] = useState({ userId: "", amount: "", date: todayStr, note: "" })
  const [expForm, setExpForm] = useState({ amount: "", category: "Bazar", date: todayStr, note: "" })

  const now = new Date()
  const isPastMonth = month !== (now.getMonth() + 1) || year !== now.getFullYear()
  const canEdit = currentUserRole === "ADMIN" || currentUserRole === "MANAGER"

  // Filter deposits for MEMBER
  const visibleDeposits = currentUserRole === "MEMBER" 
    ? deposits.filter(d => d.userId === currentUserId) 
    : deposits

  const totalDeposits = visibleDeposits.reduce((sum, d) => sum + d.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  const handleMonthChange = (offset: number) => {
    let newMonth = month + offset
    let newYear = year
    if (newMonth > 12) { newMonth = 1; newYear++ }
    else if (newMonth < 1) { newMonth = 12; newYear-- }
    router.push(`/finance?month=${newMonth}&year=${newYear}`)
  }

  const handleCopySummary = () => {
    let text = `Mess Summary: ${format(new Date(year, month - 1), "MMMM yyyy")}\n`
    text += `Meal Rate: ৳${monthSummary.mealRate.toFixed(2)}\n\n`
    
    monthSummary.memberSummaries.forEach(m => {
      text += `${m.name}:\n`
      text += `Meals: ${m.meals} | Cost: ৳${m.cost.toFixed(2)} | Paid: ৳${m.paid.toFixed(2)}\n`
      text += `Due: ৳${m.due.toFixed(2)}\n\n`
    })
    
    text += `--- Totals ---\n`
    text += `Total Meals: ${monthSummary.totalMeals}\n`
    text += `Total Expense: ৳${monthSummary.totalExpense.toFixed(2)}\n`
    text += `Total Deposits: ৳${monthSummary.totalDeposits.toFixed(2)}\n`
    
    navigator.clipboard.writeText(text)
    toast.success("Summary copied to clipboard!")
  }

  const submitDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const res = await addDeposit({
      userId: depForm.userId,
      amount: parseFloat(depForm.amount),
      date: depForm.date,
      note: depForm.note || undefined,
    })
    setIsLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else if (res.deposit) {
      toast.success("Deposit recorded")
      // Fetch latest or just reload. Next.js server actions revalidatePath might just work.
      // But to be fully optimistic/fast without waiting for RSC payload if we don't want to:
      // Actually, since we revalidatePath in the action, it might not happen if we don't call it. 
      // The instructions said we use `revalidatePath`. Let's just do a router.refresh() 
      router.refresh()
      setIsDepositOpen(false)
      setDepForm({ userId: "", amount: "", date: todayStr, note: "" })
    }
  }

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const res = await addExpense({
      amount: parseFloat(expForm.amount),
      category: expForm.category,
      date: expForm.date,
      note: expForm.note || undefined,
    })
    setIsLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else if (res.expense) {
      toast.success("Expense recorded")
      router.refresh()
      setIsExpenseOpen(false)
      setExpForm({ amount: "", category: "Bazar", date: todayStr, note: "" })
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setIsLoading(true)
    let res
    if (deleteConfirm.type === "deposit") {
      res = await deleteDeposit(deleteConfirm.id)
    } else {
      res = await deleteExpense(deleteConfirm.id)
    }
    setIsLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Record deleted")
      router.refresh()
    }
    setDeleteConfirm(null)
  }

  const dateLabel = format(new Date(year, month - 1), "MMMM yyyy")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Finance</h2>
          {["ADMIN", "MANAGER"].includes(currentUserRole) && (
            <ExportReportButton month={month} year={year} variant="outline" />
          )}
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

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[500px]">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        {/* SUMMARY TAB */}
        <TabsContent value="summary" className="space-y-4 mt-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="py-6 text-center">
              <CardDescription className="uppercase tracking-wider font-semibold text-primary">Meal Rate</CardDescription>
              <CardTitle className="text-4xl md:text-5xl font-extrabold text-foreground mt-2">
                ৳{monthSummary.mealRate.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="flex justify-between items-center px-1 mt-6">
            <h3 className="text-xl font-semibold">Members Overview</h3>
            <Button variant="outline" size="sm" onClick={handleCopySummary}>
              Copy Summary
            </Button>
          </div>

          <div className="space-y-3">
            {monthSummary.memberSummaries.map(m => (
              <div key={m.userId} className={`border rounded-lg p-4 bg-card shadow-sm ${m.userId === currentUserId ? 'ring-2 ring-primary/50' : ''}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-lg">{m.name} {!m.isActive && <span className="text-sm font-normal text-muted-foreground">(Inactive)</span>}</span>
                  <div className={`font-bold px-3 py-1 rounded-full text-sm ${m.due > 0 ? 'bg-red-500/10 text-red-600' : m.due < 0 ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    {m.due > 0 ? `Owes: ৳${m.due.toFixed(2)}` : m.due < 0 ? `Advance: ৳${Math.abs(m.due).toFixed(2)}` : `Settled (৳0)`}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-muted/30 p-2 rounded text-center">
                    <div className="text-muted-foreground text-xs uppercase mb-1">Meals</div>
                    <div className="font-medium">{m.meals}</div>
                  </div>
                  <div className="bg-muted/30 p-2 rounded text-center">
                    <div className="text-muted-foreground text-xs uppercase mb-1">Cost</div>
                    <div className="font-medium">৳{m.cost.toFixed(2)}</div>
                  </div>
                  <div className="bg-muted/30 p-2 rounded text-center">
                    <div className="text-muted-foreground text-xs uppercase mb-1">Paid</div>
                    <div className="font-medium text-green-600">৳{m.paid.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Mess Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Total Meals</span>
                  <span className="font-medium">{monthSummary.totalMeals}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Total Expense</span>
                  <span className="font-medium text-red-600">৳{monthSummary.totalExpense.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Total Deposits</span>
                  <span className="font-medium text-green-600">৳{monthSummary.totalDeposits.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Net Balance</span>
                  <span className={`font-bold ${monthSummary.totalDeposits - monthSummary.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ৳{(monthSummary.totalDeposits - monthSummary.totalExpense).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEPOSITS TAB */}
        <TabsContent value="deposits" className="space-y-4 mt-4">
          <Card className="bg-green-500/10 border-green-500/20">
            <CardHeader className="py-4">
              <CardTitle className="text-xl flex items-center justify-between">
                <span>Total Deposits</span>
                <span className="text-green-600">৳ {totalDeposits.toLocaleString()}</span>
              </CardTitle>
              {currentUserRole === "MEMBER" && (
                <CardDescription>Showing only your personal deposits.</CardDescription>
              )}
            </CardHeader>
          </Card>

          {canEdit && (
            <Button onClick={() => setIsDepositOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Deposit
            </Button>
          )}

          <div className="space-y-3">
            {visibleDeposits.length === 0 ? (
              <div className="text-center p-8 border rounded-md text-muted-foreground bg-muted/20">
                No deposits found for this month.
              </div>
            ) : (
              visibleDeposits.map(d => (
                <div key={d.id} className="border rounded-lg p-4 bg-card shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{d.user.name}</span>
                      <span className="text-sm text-muted-foreground">{format(new Date(d.date), "MMM d, yyyy")}</span>
                    </div>
                    {d.note && <div className="text-sm mt-1 text-muted-foreground italic">"{d.note}"</div>}
                    <div className="text-xs text-muted-foreground mt-2">Recorded by: {d.recordedBy.name}</div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="text-lg font-bold text-green-600">৳ {d.amount.toLocaleString()}</span>
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm({ type: "deposit", id: d.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <Card className="bg-red-500/10 border-red-500/20">
            <CardHeader className="py-4">
              <CardTitle className="text-xl flex items-center justify-between">
                <span>Total Expenses</span>
                <span className="text-red-600">৳ {totalExpenses.toLocaleString()}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          {canEdit && (
            <Button onClick={() => setIsExpenseOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          )}

          <div className="space-y-3">
            {expenses.length === 0 ? (
              <div className="text-center p-8 border rounded-md text-muted-foreground bg-muted/20">
                No expenses found for this month.
              </div>
            ) : (
              expenses.map(e => (
                <div key={e.id} className="border rounded-lg p-4 bg-card shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className={e.category === 'Bazar' ? 'border-primary text-primary' : 'border-orange-500 text-orange-500'}>
                        {e.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{format(new Date(e.date), "MMM d, yyyy")}</span>
                    </div>
                    {e.note && <div className="text-sm mt-1 text-muted-foreground italic">"{e.note}"</div>}
                    <div className="text-xs text-muted-foreground mt-2">Recorded by: {e.recordedBy.name}</div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="text-lg font-bold text-red-600">৳ {e.amount.toLocaleString()}</span>
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm({ type: "expense", id: e.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Deposit Dialog */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Deposit</DialogTitle>
            <DialogDescription>Record a cash payment from a member.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitDeposit} className="space-y-4">
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={depForm.userId} onValueChange={v => setDepForm({ ...depForm, userId: v || "" })} required>
                <SelectTrigger><SelectValue placeholder="Select member..." /></SelectTrigger>
                <SelectContent>
                  {activeUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (৳)</Label>
              <Input type="number" min="1" required value={depForm.amount} onChange={e => setDepForm({ ...depForm, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" required value={depForm.date} onChange={e => setDepForm({ ...depForm, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Input value={depForm.note} onChange={e => setDepForm({ ...depForm, note: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDepositOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading || !depForm.userId}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Deposit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a cash expense for the mess.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitExpense} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={expForm.category} onValueChange={v => setExpForm({ ...expForm, category: v || "Bazar" })} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bazar">Bazar (Groceries)</SelectItem>
                  <SelectItem value="Utility">Utility (Gas/Water/Electricity)</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (৳)</Label>
              <Input type="number" min="1" required value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" required value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Input value={expForm.note} onChange={e => setExpForm({ ...expForm, note: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsExpenseOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteConfirm?.type} record from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
