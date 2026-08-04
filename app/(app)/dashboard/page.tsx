import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { format, getDaysInMonth } from "date-fns"
import { ShieldCheck, User, Receipt, Utensils, PiggyBank, CalendarClock } from "lucide-react"
import { getMonthSummary } from "@/lib/calculations"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { ExportReportButton } from "@/components/shared/export-report-button"
import { getBDNow } from "@/lib/timezone"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const messId = session?.user?.messId
  const userId = session?.user?.id
  const role = session?.user?.role

  if (!messId || !userId) return null

  const now = getBDNow()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const [term, summary, recentActivity] = await Promise.all([
    prisma.managerTerm.findUnique({
      where: { messId_month_year: { messId, month, year } },
      include: {
        user: { select: { id: true, name: true, username: true } }
      }
    }),
    getMonthSummary({ messId, month, year }),
    role === "MEMBER" ? prisma.activityLog.findMany({
      where: { 
        messId, 
        action: { in: ["MEAL_UPDATED", "EXPENSE_ADDED", "DEPOSIT_ADDED"] } 
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { user: { select: { name: true } } }
    }) : Promise.resolve([])
  ])

  const currentManager = term
  const currentMonthName = format(now, "MMMM yyyy")
  const daysInMonth = getDaysInMonth(now)
  const todayBD = parseInt(now.toISOString().split("T")[0].split("-")[2], 10)
  const daysLeft = daysInMonth - todayBD

  const isMember = role === "MEMBER"
  const isAdmin = role === "ADMIN" || role === "MANAGER"
  const isManager = role === "MANAGER"
  const mySummary = summary.memberSummaries.find(m => m.userId === userId)

  const { describeActivity } = await import("@/lib/activity-log")

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <p>Welcome back, {session?.user?.name || session?.user?.username}!</p>

      {isAdmin && !currentManager && (
        <Card className="bg-orange-500/10 border-orange-500/20 shadow-sm animate-pulse">
          <CardHeader className="py-4">
            <CardTitle className="text-orange-700 flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5" />
              Action Required
            </CardTitle>
            <CardDescription className="text-orange-700/80">
              No manager has been assigned for {currentMonthName}. 
              <Link href="/manager" className="font-semibold underline ml-1 hover:text-orange-800">
                Assign one now.
              </Link>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isMember && mySummary ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Your Status: {currentMonthName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-background rounded-lg p-3 border shadow-sm">
                    <Utensils className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Meals Eaten</div>
                    <div className="text-2xl font-bold">{mySummary.meals}</div>
                  </div>
                  <div className="bg-background rounded-lg p-3 border shadow-sm">
                    <Receipt className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Cost</div>
                    <div className="text-2xl font-bold">৳{mySummary.cost.toFixed(2)}</div>
                  </div>
                  <div className="bg-background rounded-lg p-3 border shadow-sm">
                    <PiggyBank className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Paid</div>
                    <div className="text-2xl font-bold text-green-600">৳{mySummary.paid.toFixed(2)}</div>
                  </div>
                  <div className={`rounded-lg p-3 border shadow-sm flex flex-col justify-center ${mySummary.due > 0 ? 'bg-red-500/10 border-red-500/20 text-red-700' : mySummary.due < 0 ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-background'}`}>
                    <div className="text-sm font-medium uppercase tracking-wider mb-1">
                      {mySummary.due > 0 ? "You Owe" : mySummary.due < 0 ? "Mess Owes You" : "Balance"}
                    </div>
                    <div className="text-2xl font-bold">
                      ৳{Math.abs(mySummary.due).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end pt-2">
                  <Link href="/meals" className={buttonVariants({ variant: "outline" })}>My Meals</Link>
                  <Link href="/finance" className={buttonVariants({ variant: "default" })}>Full Summary</Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Current Manager
                </CardTitle>
                <CardDescription>Managing for {currentMonthName}</CardDescription>
              </CardHeader>
              <CardContent>
                {currentManager ? (
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary">
                      <AvatarFallback className="text-lg">
                        {currentManager.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-lg font-bold flex items-center gap-2">
                        {currentManager.user.name}
                        <Badge className="bg-orange-500">Manager</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Assigned on {format(new Date(currentManager.assignedAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <User className="h-5 w-5" />
                    No manager assigned yet for this month.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Recent Mess Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No recent activity.</div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map(act => (
                      <div key={act.id} className="text-sm border-b pb-3 last:border-0 last:pb-0">
                        <span className="font-semibold">{act.user.name}</span>
                        <p className="text-muted-foreground mt-1 line-clamp-2">
                          {describeActivity(act as any)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Mess Overview: {currentMonthName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-background rounded-lg p-3 border shadow-sm">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Meal Rate</div>
                  <div className="text-3xl font-black text-primary">৳{summary.mealRate.toFixed(2)}</div>
                </div>
                <div className="bg-background rounded-lg p-3 border shadow-sm">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Expenses</div>
                  <div className="text-2xl font-bold text-red-600">৳{summary.totalExpense.toFixed(2)}</div>
                </div>
                <div className="bg-background rounded-lg p-3 border shadow-sm">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Deposits</div>
                  <div className="text-2xl font-bold text-green-600">৳{summary.totalDeposits.toFixed(2)}</div>
                </div>
                <div className="bg-background rounded-lg p-3 border shadow-sm flex flex-col justify-center items-center">
                  <CalendarClock className="h-5 w-5 mb-1 text-muted-foreground" />
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Days Left</div>
                  <div className="text-2xl font-bold">{daysLeft}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-end pt-4 mt-2 border-t border-primary/10">
                <ExportReportButton month={month} year={year} variant="outline" />
                <Link href="/meals" className={buttonVariants({ variant: "outline" })}>
                  <Utensils className="h-4 w-4 mr-2" /> Add Meal
                </Link>
                <Link href="/finance?tab=expenses" className={buttonVariants({ variant: "outline" })}>
                  <Receipt className="h-4 w-4 mr-2" /> Add Expense
                </Link>
                <Link href="/finance" className={buttonVariants({ variant: "default" })}>
                  View Full Summary
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-muted/50 max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Current Manager
              </CardTitle>
              <CardDescription>Managing for {currentMonthName}</CardDescription>
            </CardHeader>
            <CardContent>
              {currentManager ? (
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarFallback className="text-lg">
                      {currentManager.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-lg font-bold flex items-center gap-2">
                      {currentManager.user.name}
                      <Badge className="bg-orange-500">Manager</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Assigned on {format(new Date(currentManager.assignedAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground flex items-center gap-2">
                  <User className="h-5 w-5" />
                  No manager assigned yet for this month.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
