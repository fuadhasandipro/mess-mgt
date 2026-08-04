import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { ManagerClient } from "@/components/manager/manager-client"
import { getBDNow } from "@/lib/timezone"

export default async function ManagerPage() {
  const session = await requireRole(["ADMIN", "MANAGER"])
  const messId = session.user.messId

  const now = getBDNow()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const currentTerm = await prisma.managerTerm.findUnique({
    where: { messId_month_year: { messId, month, year } },
    include: {
      user: { select: { id: true, name: true, username: true } }
    }
  })

  const history = await prisma.managerTerm.findMany({
    where: { messId },
    orderBy: [
      { year: "desc" },
      { month: "desc" }
    ],
    include: {
      user: { select: { id: true, name: true, username: true } }
    }
  })

  const activeUsers = await prisma.user.findMany({
    where: { messId, isActive: true },
    select: { id: true, name: true, username: true, role: true },
    orderBy: { name: "asc" }
  })

  // We filter out history for the current month from the "past history" display
  // by keeping it all in `history` but maybe the client wants it separate.
  // Actually, keeping the current term in history is fine, or we filter it out.
  const pastHistory = history.filter(t => !(t.month === month && t.year === year))

  return (
    <ManagerClient 
      currentTerm={currentTerm} 
      history={pastHistory} 
      activeUsers={activeUsers} 
    />
  )
}
