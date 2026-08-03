import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { MealsClient } from "@/components/meals/meals-client"

export default async function MealsPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string, year?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const session = await requireRole(["ADMIN", "MANAGER", "MEMBER"])
  const messId = session.user.messId
  
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  const month = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : currentMonth
  const year = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentYear
  
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59))

  // Find all users in the mess (we need all active users, and any inactive users who had meals this month)
  const users = await prisma.user.findMany({
    where: {
      messId,
      OR: [
        { isActive: true },
        { meals: { some: { date: { gte: startDate, lte: endDate } } } }
      ]
    },
    select: { id: true, name: true, username: true, isActive: true },
    orderBy: { name: "asc" }
  })

  // Find all meals for these users in this month
  const meals = await prisma.meal.findMany({
    where: {
      user: { messId },
      date: { gte: startDate, lte: endDate }
    },
    select: {
      id: true,
      userId: true,
      date: true,
      breakfast: true,
      lunch: true,
      dinner: true
    }
  })
  
  // Convert dates to YYYY-MM-DD string format to pass to Client Component
  const formattedMeals = meals.map(m => ({
    ...m,
    date: m.date.toISOString().split("T")[0]
  }))

  return (
    <MealsClient 
      initialUsers={users}
      initialMeals={formattedMeals}
      month={month}
      year={year}
      currentUserRole={session.user.role}
    />
  )
}
