"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { changePassword } from "@/lib/actions/members"
import { signOut } from "next-auth/react"
import { LogOut, KeyRound, UserCircle } from "lucide-react"

type ProfileClientProps = {
  user: {
    name: string
    username: string
    role: string
    phone: string | null
    messName: string
  }
}

export function ProfileClient({ user }: ProfileClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [passForm, setPassForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passForm.newPassword !== passForm.confirmPassword) {
      return toast.error("New passwords do not match")
    }

    setIsLoading(true)
    const res = await changePassword({
      oldPassword: passForm.oldPassword,
      newPassword: passForm.newPassword
    })
    setIsLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Password changed successfully! Please log in again.")
      setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
      // Auto logout after password change
      setTimeout(() => signOut({ callbackUrl: "/login" }), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            Account Details
          </CardTitle>
          <CardDescription>Your personal information in {user.messName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Name</span>
              <p className="font-semibold text-lg">{user.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Username</span>
              <p className="font-semibold text-lg">{user.username}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Role</span>
              <p className="font-semibold text-lg">{user.role}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Phone</span>
              <p className="font-semibold text-lg">{user.phone || "Not set"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="old">Current Password</Label>
              <Input 
                id="old" 
                type="password" 
                required 
                value={passForm.oldPassword}
                onChange={e => setPassForm({ ...passForm, oldPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input 
                id="new" 
                type="password" 
                required 
                minLength={6}
                value={passForm.newPassword}
                onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input 
                id="confirm" 
                type="password" 
                required 
                minLength={6}
                value={passForm.confirmPassword}
                onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Logout
          </CardTitle>
          <CardDescription>Sign out of your account on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
