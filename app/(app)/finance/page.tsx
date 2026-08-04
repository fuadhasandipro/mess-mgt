import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { FinanceClient } from "@/components/finance/finance-client"
import { getBDNow } from "@/lib/timezone"

export default async function FinancePage({
  searchParams
}: {
  searchParams: Promise<{ month?: string, year?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const session = await requireRole(["ADMIN", "MANAGER", "MEMBER"])
  const messId = session.user.messId
  
  const now = getBDNow()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  const month = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : currentMonth
  const year = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentYear
  
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59))

  // Find all active users (for the Add Deposit dropdown)
  const allUsers = await prisma.user.findMany({
    where: { messId },
    select: { id: true, name: true, isActive: true },
    orderBy: { name: "asc" }
  })
  const activeUsers = allUsers.filter(u => u.isActive)
  const userMap = new Map(allUsers.map(u => [u.id, u.name]))

  // Find deposits
  const rawDeposits = await prisma.deposit.findMany({
    where: {
      messId,
      date: { gte: startDate, lte: endDate }
    },
    include: {
      user: { select: { name: true } }
    },
    orderBy: { date: "desc" }
  })

  const deposits = rawDeposits.map(d => ({
    ...d,
    recordedBy: { name: userMap.get(d.addedById) || "Unknown User" },
    date: d.date.toISOString(),
  }))

  // Find expenses
  const rawExpenses = await prisma.expense.findMany({
    where: {
      messId,
      date: { gte: startDate, lte: endDate }
    },
    orderBy: { date: "desc" }
  })

  const expenses = rawExpenses.map(e => ({
    ...e,
    recordedBy: { name: userMap.get(e.addedById) || "Unknown User" },
    date: e.date.toISOString(),
  }))

  const { getMonthSummary } = await import("@/lib/calculations")
  const monthSummary = await getMonthSummary({ messId, month, year })

  return (
    <FinanceClient 
      initialDeposits={deposits}
      initialExpenses={expenses}
      activeUsers={activeUsers}
      monthSummary={monthSummary}
      month={month}
      year={year}
      currentUserRole={session.user.role}
      currentUserId={session.user.id}
    />
  )
}
