"use server"

import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getMonthSummary } from "@/lib/calculations"

export async function getMonthlyReportData(month: number, year: number) {
  const session = await requireRole(["ADMIN", "MANAGER"])
  const messId = session.user.messId

  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59))

  // 1. Get Summary
  const summary = await getMonthSummary({ messId, month, year })

  // 2. Get Meals
  const meals = await prisma.meal.findMany({
    where: { messId, date: { gte: startDate, lte: endDate } },
    include: {
      user: { select: { name: true } }
    },
    orderBy: [{ user: { name: 'asc' } }, { date: 'asc' }]
  })

  // 3. Get Deposits
  const deposits = await prisma.deposit.findMany({
    where: { messId, date: { gte: startDate, lte: endDate } },
    include: {
      user: { select: { name: true } },
      addedBy: { select: { name: true } }
    },
    orderBy: { date: 'asc' }
  })

  // 4. Get Expenses
  const expenses = await prisma.expense.findMany({
    where: { messId, date: { gte: startDate, lte: endDate } },
    include: {
      addedBy: { select: { name: true } }
    },
    orderBy: { date: 'asc' }
  })

  return {
    summary,
    meals: meals.map(m => ({
      ...m,
      date: m.date.toISOString(),
      userName: m.user.name
    })),
    deposits: deposits.map(d => ({
      ...d,
      date: d.date.toISOString(),
      userName: d.user.name,
      addedByName: d.addedBy?.name || "Unknown"
    })),
    expenses: expenses.map(e => ({
      ...e,
      date: e.date.toISOString(),
      addedByName: e.addedBy?.name || "Unknown"
    }))
  }
}
