import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { MembersClient } from "@/components/members/members-client"

export default async function MembersPage() {
  const session = await requireRole(["ADMIN", "MANAGER"])

  const users = await prisma.user.findMany({
    where: { messId: session.user.messId },
    select: {
      id: true,
      name: true,
      username: true,
      phone: true,
      role: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
  })

  return <MembersClient initialMembers={users} />
}
