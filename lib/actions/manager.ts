"use server"

import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-log"
import { getBDNow } from "@/lib/timezone"

export async function assignManager(userId: string) {
  const session = await requireRole(["ADMIN", "MANAGER"])
  const messId = session.user.messId

  const now = getBDNow()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  await prisma.$transaction(async (tx) => {
    // 1. Find the current manager for this mess
    const previousManager = await tx.user.findFirst({
      where: { messId, role: "MANAGER" }
    })

    // 2. Upsert ManagerTerm for the current month/year
    await tx.managerTerm.upsert({
      where: {
        messId_month_year: { messId, month, year }
      },
      update: {
        userId,
        assignedById: session.user.id,
        assignedAt: new Date()
      },
      create: {
        messId,
        month,
        year,
        userId,
        assignedById: session.user.id
      }
    })

    // 3. Demote previous manager (if exists, not ADMIN, and different from new user)
    if (previousManager && previousManager.id !== userId && previousManager.role !== "ADMIN") {
      await tx.user.update({
        where: { id: previousManager.id },
        data: { role: "MEMBER" }
      })
    }

    // 4. Promote new user to MANAGER (unless they are ADMIN)
    const newUser = await tx.user.findUnique({ where: { id: userId } })
    if (newUser && newUser.role !== "ADMIN") {
      await tx.user.update({
        where: { id: userId },
        data: { role: "MANAGER" }
      })
    }
  })

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  await logActivity({
    userId: session.user.id,
    messId,
    action: "MANAGER_ASSIGNED",
    details: { targetName: targetUser?.name || "Unknown", month, year }
  })

  revalidatePath("/manager")
  revalidatePath("/members")
  revalidatePath("/dashboard")
  revalidatePath("/meals")
  
  return { success: true }
}
