import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { ActivityLogClient } from "@/components/activity-log/activity-log-client"

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await requireRole(["ADMIN", "MANAGER", "MEMBER"])
  const messId = session.user.messId

  const resolvedParams = await searchParams
  
  const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page) || 1 : 1
  const userIdFilter = typeof resolvedParams.user === "string" ? resolvedParams.user : undefined
  const actionFilter = typeof resolvedParams.action === "string" ? resolvedParams.action : undefined

  const take = 20
  const skip = (page - 1) * take

  const where = {
    messId,
    ...(userIdFilter && userIdFilter !== "ALL" ? { userId: userIdFilter } : {}),
    ...(actionFilter && actionFilter !== "ALL" ? { action: actionFilter } : {})
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        user: { select: { name: true } }
      }
    }),
    prisma.activityLog.count({ where })
  ])

  // Get active users for the filter
  const users = await prisma.user.findMany({
    where: { messId },
    select: { id: true, name: true, isActive: true },
    orderBy: { name: "asc" }
  })

  // Get unique actions for the filter
  const distinctActions = await prisma.activityLog.findMany({
    where: { messId },
    distinct: ["action"],
    select: { action: true }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
        <p className="text-muted-foreground">Monitor all actions across the mess.</p>
      </div>

      <ActivityLogClient 
        initialLogs={logs as any} 
        totalCount={total}
        page={page}
        pageSize={take}
        users={users}
        availableActions={distinctActions.map(a => a.action)}
        currentUserId={userIdFilter || "ALL"}
        currentAction={actionFilter || "ALL"}
      />
    </div>
  )
}
