"use server"

import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-log"
import { getBDNow } from "@/lib/timezone"

const mealSchema = z.object({
  userId: z.string(),
  date: z.string(), // Expected format: YYYY-MM-DD
  lunch: z.number().min(0).max(10),
  dinner: z.number().min(0).max(10),
})

export async function upsertMeal(input: z.infer<typeof mealSchema>) {
  const session = await requireRole(["ADMIN", "MANAGER"])
  const messId = session.user.messId

  const parsed = mealSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  
  const { userId, date, lunch, dinner } = parsed.data
  
  // Create a UTC midnight date to avoid timezone shifts
  const [yearStr, monthStr, dayStr] = date.split("-")
  const y = parseInt(yearStr)
  const m = parseInt(monthStr) - 1
  const d = parseInt(dayStr)
  const dateObj = new Date(Date.UTC(y, m, d))
  
  const now = getBDNow()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()



  // Ensure user belongs to the mess
  const user = await prisma.user.findUnique({ where: { id: userId, messId } })
  if (!user) return { error: "User not found in this mess." }

  const meal = await prisma.meal.upsert({
    where: {
      userId_date: { userId, date: dateObj }
    },
    update: { 
      lunch, 
      dinner,
      updatedById: session.user.id
    },
    create: {
      userId,
      messId,
      date: dateObj,
      lunch,
      dinner,
      updatedById: session.user.id
    }
  })

  await logActivity({
    userId: session.user.id,
    messId,
    action: "MEAL_UPDATED",
    details: { targetName: user.name, date, lunch, dinner }
  })

  revalidatePath("/meals")
  revalidatePath("/finance")
  
  return { success: true, meal }
}
