"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { assignManager } from "@/lib/actions/manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Loader2, ShieldCheck, User } from "lucide-react"
import { toast } from "sonner"
type ManagerTerm = {
  id: string
  month: number
  year: number
  assignedAt: Date
  user: {
    id: string
    name: string
    username: string
  }
}

type ActiveUser = {
  id: string
  name: string
  username: string
  role: string
}

export function ManagerClient({
  currentTerm,
  history,
  activeUsers,
}: {
  currentTerm: ManagerTerm | null
  history: ManagerTerm[]
  activeUsers: ActiveUser[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { update } = useSession()
  const router = useRouter()

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return
    setIsLoading(true)
    try {
      const res = await assignManager(selectedUserId)
      if (res.success) {
        await update()
        router.refresh()
        setIsOpen(false)
        toast.success("Manager Assigned")
      } else {
        throw new Error("Failed to assign manager")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const currentMonthName = format(new Date(), "MMMM yyyy")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Manager Assignment</h2>
        <Button onClick={() => setIsOpen(true)}>
          <ShieldCheck className="mr-2 h-4 w-4" /> Assign Manager
        </Button>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Current Manager</CardTitle>
          <CardDescription>Managing for {currentMonthName}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentTerm ? (
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarFallback className="text-xl">
                  {currentTerm.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl font-bold flex items-center gap-2">
                  {currentTerm.user.name}
                  <Badge className="bg-orange-500">Manager</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Assigned on {format(new Date(currentTerm.assignedAt), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2">
              <User className="h-5 w-5" />
              No manager assigned yet for this month.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manager History</CardTitle>
          <CardDescription>Past managers of the mess</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((term) => (
                <div key={term.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{term.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{term.user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(term.year, term.month - 1), "MMMM yyyy")}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {format(new Date(term.assignedAt), "MMM d, yyyy")}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No history available yet.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Manager</DialogTitle>
            <DialogDescription>
              Select a member to be the manager for {currentMonthName}.
              This will automatically demote the previous manager.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssign}>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              {activeUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No eligible members found.</p>
              ) : (
                <RadioGroup value={selectedUserId} onValueChange={setSelectedUserId} className="space-y-3">
                  {activeUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-3 border p-3 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedUserId(user.id)}>
                      <RadioGroupItem value={user.id} id={`user-${user.id}`} />
                      <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer flex justify-between items-center">
                        <span>{user.name} <span className="text-muted-foreground">(@{user.username})</span></span>
                        {user.role === "MANAGER" && <Badge className="bg-orange-500">Current</Badge>}
                        {user.role === "ADMIN" && <Badge variant="destructive">Admin</Badge>}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!selectedUserId || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign as Manager
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
