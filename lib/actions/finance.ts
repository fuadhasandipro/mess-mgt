"use server"

import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-log"

// --- HELPERS ---

async function checkDatePermission(date: Date, role: string) {
  if (role === "ADMIN") return null
  
  const now = new Date()
  if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) {
    return "Managers can only modify records for the current month."
  }
  return null
}

// --- DEPOSITS ---

const depositSchema = z.object({
  userId: z.string().min(1, "User is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string(), // YYYY-MM-DD
  note: z.string().optional(),
})

export async function addDeposit(input: z.infer<typeof depositSchema>) {
  const session = await requireRole(["ADMIN", "MANAGER"])
  const messId = session.user.messId

  const parsed = depositSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { userId, amount, date, note } = parsed.data
  
  const [yearStr, monthStr, dayStr] = date.split("-")
  const dateObj = new Date(Date.UTC(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr)))

  const permError = await checkDatePermission(dateObj, session.user.role)
  if (permError) return { error: permError }

  // Verify user exists in mess
  const targetUser = await prisma.user.findUnique({ where: { id: userId, messId } })
  if (!targetUser) return { error: "User not found in this mess." }

  const deposit = await prisma.deposit.create({
    data: {
      userId,
      messId,
      amount,
      date: dateObj,
      note,
      addedById: session.user.id
    }
  })

  await logActivity({
    userId: session.user.id,
    messId,
    action: "DEPOSIT_ADDED",
    details: { targetName: targetUser.name, amount }
  })
  
  return { success: true, deposit }
}

export async function deleteDeposit(id: string) {
  const session = await requireRole(["ADMIN", "MANAGER"])
  const messId = session.user.messId

  const deposit = await prisma.deposit.findUnique({ where: { id, messId } })
  if (!deposit) return { error: "Deposit not found." }

  const permError = await checkDatePermission(deposit.date, session.user.role)
  if (permError) return { error: permError }

  const depositWithUser = await prisma.deposit.findUnique({
    where: { id },
    include: { user: { select: { name: true } } }
  })
  
  await prisma.deposit.delete({ where: { id } })

  if (depositWithUser) {
    await logActivity({
      userId: session.user.id,
      messId,
      action: "DEPOSIT_DELETED",
      details: { targetName: depositWithUser.user.name, amount: depositWithUser.amount }
    })
  }

  return { success: true }
}

// --- EXPENSES ---

const expenseSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  date: z.string(), // YYYY-MM-DD
  note: z.string().optional(),
})

export async function addExpense(input: z.infer<typeof expenseSchema>) {
  const session = await requireRole(["ADMIN", "MANAGER"])
  const messId = session.user.messId

  const parsed = expenseSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { amount, category, date, note } = parsed.data

  const [yearStr, monthStr, dayStr] = date.split("-")
  const dateObj = new Date(Date.UTC(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr)))

  const permError = await checkDatePermission(dateObj, session.user.role)
  if (permError) return { error: permError }

  const expense = await prisma.expense.create({
    data: {
      messId,
      amount,
      category,
      date: dateObj,
      note,
      addedById: session.user.id
    }
  })

  await logActivity({
    userId: session.user.id,
    messId,
    action: "EXPENSE_ADDED",
    details: { category, amount }
  })
  
  return { success: true, expense }
}

export async function deleteExpense(id: string) {
  const session = await requireRole(["ADMIN", "MANAGER"])
  const messId = session.user.messId

  const expense = await prisma.expense.findUnique({ where: { id, messId } })
  if (!expense) return { error: "Expense not found." }

  const permError = await checkDatePermission(expense.date, session.user.role)
  if (permError) return { error: permError }

  await prisma.expense.delete({ where: { id } })

  await logActivity({
    userId: session.user.id,
    messId,
    action: "EXPENSE_DELETED",
    details: { category: expense.category, amount: expense.amount }
  })

  return { success: true }
}
