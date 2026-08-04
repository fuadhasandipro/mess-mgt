import { prisma } from "@/lib/db"

export async function logActivity({
  userId,
  messId,
  action,
  details,
}: {
  userId: string
  messId: string
  action: string
  details?: Record<string, any>
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        messId,
        action,
        details: details ? (details as any) : undefined,
      }
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}

export function describeActivity(log: { action: string; details: any; user: { name: string } }): string {
  const { action, details, user } = log
  const actor = user.name

  switch (action) {
    case "LOGIN":
      return `${actor} logged in.`
    case "LOGOUT":
      return `${actor} logged out.`
    
    // Members
    case "MEMBER_ADDED":
      return `${actor} added a new member: ${details?.targetName || "Unknown"}.`
    case "MEMBER_UPDATED":
      return `${actor} updated details for ${details?.targetName || "a member"}.`
    case "MEMBER_DEACTIVATED":
      return `${actor} deactivated the account for ${details?.targetName || "a member"}.`
    case "MEMBER_REACTIVATED":
      return `${actor} reactivated the account for ${details?.targetName || "a member"}.`
    case "PASSWORD_RESET":
      return `${actor} reset the password for ${details?.targetName || "a member"}.`
      
    // Manager
    case "MANAGER_ASSIGNED":
      return `${actor} promoted ${details?.targetName || "a member"} to MANAGER for month ${details?.month}/${details?.year}.`
      
    // Meals
    case "MEAL_UPDATED":
      return `${actor} updated meals for ${details?.targetName || "a member"} on ${details?.date} (L: ${details?.lunch}, D: ${details?.dinner}).`
      
    // Finance
    case "DEPOSIT_ADDED":
      return `${actor} added a deposit of ৳${details?.amount} for ${details?.targetName || "a member"}.`
    case "DEPOSIT_DELETED":
      return `${actor} deleted a deposit of ৳${details?.amount} for ${details?.targetName || "a member"}.`
    case "EXPENSE_ADDED":
      return `${actor} recorded a ${details?.category || "Bazar"} expense of ৳${details?.amount}.`
    case "EXPENSE_DELETED":
      return `${actor} deleted a ${details?.category || "Bazar"} expense of ৳${details?.amount}.`
      
    default:
      return `${actor} performed action: ${action}.`
  }
}
