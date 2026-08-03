"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow, format } from "date-fns"
import { describeActivity } from "@/lib/activity-log"

type ActivityLogClientProps = {
  initialLogs: {
    id: string
    userId: string
    action: string
    details: any
    createdAt: Date
    user: { name: string }
  }[]
  totalCount: number
  page: number
  pageSize: number
  users: { id: string; name: string; isActive: boolean }[]
  availableActions: string[]
  currentUserId: string
  currentAction: string
}

export function ActivityLogClient({
  initialLogs,
  totalCount,
  page,
  pageSize,
  users,
  availableActions,
  currentUserId,
  currentAction,
}: ActivityLogClientProps) {
  const router = useRouter()

  const totalPages = Math.ceil(totalCount / pageSize)

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search)
    if (value === "ALL") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete("page") // reset to page 1 on filter change
    router.push(`/activity-log?${params.toString()}`)
  }

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set("page", newPage.toString())
    router.push(`/activity-log?${params.toString()}`)
  }

  // Group logs by day
  const groupedLogs = initialLogs.reduce((acc, log) => {
    // Ensure date is properly parsed if passed from Server Component as string
    const d = new Date(log.createdAt)
    const day = format(d, "yyyy-MM-dd")
    if (!acc[day]) acc[day] = []
    acc[day].push({ ...log, createdAt: d })
    return acc
  }, {} as Record<string, typeof initialLogs>)

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <CardTitle>Log History</CardTitle>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={currentUserId} onValueChange={(v) => updateFilters("user", v || "ALL")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Users</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currentAction} onValueChange={(v) => updateFilters("action", v || "ALL")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actions</SelectItem>
              {availableActions.map(a => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {initialLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity found for these filters.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedLogs).map(([day, logs]) => (
              <div key={day}>
                <h3 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider sticky top-0 bg-card py-2 z-10 border-b">
                  {format(new Date(day), "MMMM d, yyyy")}
                </h3>
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="flex gap-4 items-start group">
                      <Avatar className="h-10 w-10 border mt-0.5">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {log.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          {describeActivity(log)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                          </span>
                          <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity">
                            {log.action}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t mt-6 pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => changePage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => changePage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
