"use server"

import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { logActivity } from "@/lib/activity-log"

const mealSchema = z.object({
  userId: z.string(),
  date: z.string(), // Expected format: YYYY-MM-DD
  breakfast: z.number().min(0).max(10),
  lunch: z.number().min(0).max(10),
  dinner: z.number().min(0).max(10),
})

export async function upsertMeal(input: z.infer<typeof mealSchema>) {
  const session = await requireRole(["ADMIN", "MANAGER"])
  const messId = session.user.messId

  const parsed = mealSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  
  const { userId, date, breakfast, lunch, dinner } = parsed.data
  
  // Create a UTC midnight date to avoid timezone shifts
  const [yearStr, monthStr, dayStr] = date.split("-")
  const y = parseInt(yearStr)
  const m = parseInt(monthStr) - 1
  const d = parseInt(dayStr)
  const dateObj = new Date(Date.UTC(y, m, d))
  
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Only ADMIN can edit past/future months. MANAGER can only edit current month.
  if (session.user.role === "MANAGER" && (m !== currentMonth || y !== currentYear)) {
    return { error: "Managers can only edit meals for the current month." }
  }

  // Ensure user belongs to the mess
  const user = await prisma.user.findUnique({ where: { id: userId, messId } })
  if (!user) return { error: "User not found in this mess." }

  const meal = await prisma.meal.upsert({
    where: {
      userId_date: { userId, date: dateObj }
    },
    update: { 
      breakfast, 
      lunch, 
      dinner,
      updatedById: session.user.id
    },
    create: {
      userId,
      messId,
      date: dateObj,
      breakfast,
      lunch,
      dinner,
      updatedById: session.user.id
    }
  })

  await logActivity({
    userId: session.user.id,
    messId,
    action: "MEAL_UPDATED",
    details: { targetName: user.name, date, breakfast, lunch, dinner }
  })
  
  return { success: true, meal }
}
