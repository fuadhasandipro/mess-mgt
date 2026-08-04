import { prisma } from "@/lib/db"

export function getMealRate(totalExpense: number, totalMeals: number) {
  if (totalMeals === 0) return 0
  return totalExpense / totalMeals
}

export function getMemberSummary(memberMeals: number, mealRate: number, memberDeposits: number) {
  const memberCost = memberMeals * mealRate
  const memberDue = memberCost - memberDeposits
  return { memberCost, memberDue }
}

export async function getMonthSummary({ messId, month, year }: { messId: string, month: number, year: number }) {
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59))

  // Fetch users who are active or have meals/deposits this month
  const users = await prisma.user.findMany({
    where: { 
      messId,
      OR: [
        { isActive: true },
        { meals: { some: { date: { gte: startDate, lte: endDate } } } },
        { deposits: { some: { date: { gte: startDate, lte: endDate } } } }
      ]
    },
    select: { id: true, name: true, isActive: true }
  })

  // Fetch all relevant data
  const meals = await prisma.meal.findMany({
    where: { messId, date: { gte: startDate, lte: endDate } },
    select: { userId: true, lunch: true, dinner: true }
  })

  const deposits = await prisma.deposit.findMany({
    where: { messId, date: { gte: startDate, lte: endDate } }
  })

  const expenses = await prisma.expense.findMany({
    where: { messId, date: { gte: startDate, lte: endDate } }
  })

  let totalExpense = 0
  expenses.forEach(e => totalExpense += e.amount)

  let totalDeposits = 0
  deposits.forEach(d => totalDeposits += d.amount)

  // Map per-user totals
  const userStats = new Map<string, { meals: number, paid: number }>()
  users.forEach(u => userStats.set(u.id, { meals: 0, paid: 0 }))

  let totalMeals = 0
  meals.forEach(m => {
    const mealCount = m.lunch + m.dinner
    totalMeals += mealCount
    const stat = userStats.get(m.userId)
    if (stat) stat.meals += mealCount
  })

  deposits.forEach(d => {
    const stat = userStats.get(d.userId)
    if (stat) stat.paid += d.amount
  })

  const mealRate = getMealRate(totalExpense, totalMeals)

  const memberSummaries = users.map(u => {
    const stats = userStats.get(u.id)!
    const { memberCost, memberDue } = getMemberSummary(stats.meals, mealRate, stats.paid)
    return {
      userId: u.id,
      name: u.name,
      isActive: u.isActive,
      meals: stats.meals,
      cost: memberCost,
      paid: stats.paid,
      due: memberDue
    }
  }).sort((a, b) => a.name.localeCompare(b.name))

  return {
    mealRate,
    totalExpense,
    totalMeals,
    totalDeposits,
    memberSummaries
  }
}
