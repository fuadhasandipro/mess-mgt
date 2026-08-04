"use server"

import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-log"

const createMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function createMember(input: z.infer<typeof createMemberSchema>) {
  const session = await requireRole(["ADMIN", "MANAGER"])
  
  const parsed = createMemberSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  
  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  })
  
  if (existing) {
    return { error: "Username already taken" }
  }
  
  const passwordHash = await bcrypt.hash(parsed.data.password, 10)
  
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      phone: parsed.data.phone || null,
      passwordHash,
      messId: session.user.messId,
      role: "MEMBER",
    },
  })
  
  await logActivity({
    userId: session.user.id,
    messId: session.user.messId,
    action: "MEMBER_ADDED",
    details: { targetName: user.name }
  })
  
  revalidatePath("/members")
  return { success: true, user }
}

const updateMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  phone: z.string().optional(),
})

export async function updateMember(id: string, input: z.infer<typeof updateMemberSchema>) {
  const session = await requireRole(["ADMIN", "MANAGER"])
  
  const parsed = updateMemberSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  
  // check if another user has this username
  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  })
  
  if (existing && existing.id !== id) {
    return { error: "Username already taken by another user" }
  }
  
  await prisma.user.update({
    where: { id, messId: session.user.messId },
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      phone: parsed.data.phone || null,
    },
  })
  
  await logActivity({
    userId: session.user.id,
    messId: session.user.messId,
    action: "MEMBER_UPDATED",
    details: { targetName: parsed.data.name }
  })
  
  revalidatePath("/members")
  return { success: true }
}

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function resetPassword(id: string, newPassword: string) {
  const session = await requireRole(["ADMIN", "MANAGER"])
  
  const parsed = resetPasswordSchema.safeParse({ password: newPassword })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  
  const passwordHash = await bcrypt.hash(parsed.data.password, 10)
  
  await prisma.user.update({
    where: { id, messId: session.user.messId },
    data: { passwordHash },
  })
  
  const targetUser = await prisma.user.findUnique({ where: { id } })
  await logActivity({
    userId: session.user.id,
    messId: session.user.messId,
    action: "PASSWORD_RESET",
    details: { targetName: targetUser?.name || "Unknown" }
  })
  
  revalidatePath("/members")
  return { success: true }
}

export async function setActive(id: string, isActive: boolean) {
  const session = await requireRole(["ADMIN", "MANAGER"])
  
  await prisma.user.update({
    where: { id, messId: session.user.messId },
    data: { isActive },
  })
  
  const targetUser = await prisma.user.findUnique({ where: { id } })
  await logActivity({
    userId: session.user.id,
    messId: session.user.messId,
    action: isActive ? "MEMBER_REACTIVATED" : "MEMBER_DEACTIVATED",
    details: { targetName: targetUser?.name || "Unknown" }
  })
  
  revalidatePath("/members")
  revalidatePath("/members")
  return { success: true }
}

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
})

export async function changePassword(input: z.infer<typeof changePasswordSchema>) {
  const session = await requireRole(["ADMIN", "MANAGER", "MEMBER"])
  
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return { error: "User not found" }

  const isValid = await bcrypt.compare(parsed.data.oldPassword, user.passwordHash)
  if (!isValid) return { error: "Incorrect old password" }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10)
  
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  })

  await logActivity({
    userId: user.id,
    messId: user.messId,
    action: "PASSWORD_CHANGED",
    details: { targetName: "Themselves" }
  })

  return { success: true }
}
