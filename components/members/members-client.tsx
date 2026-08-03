"use client"

import { useState } from "react"
import { createMember, updateMember, resetPassword, setActive } from "@/lib/actions/members"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Plus, Key, Edit, Power, PowerOff, Loader2 } from "lucide-react"

type Member = {
  id: string
  name: string
  username: string
  phone: string | null
  role: string
  isActive: boolean
}

export function MembersClient({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers)
  
  // Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  
  // Form state
  const [activeMember, setActiveMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState({ name: "", username: "", phone: "", password: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Handlers
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    const res = await createMember({
      name: formData.name,
      username: formData.username,
      phone: formData.phone,
      password: formData.password,
    })
    
    setIsLoading(false)
    if (res.error) {
      setError(res.error)
    } else if (res.user) {
      // optimistic update
      setMembers([...members, {
        id: res.user.id,
        name: res.user.name,
        username: res.user.username,
        phone: res.user.phone,
        role: res.user.role,
        isActive: res.user.isActive
      }])
      setIsAddOpen(false)
      setFormData({ name: "", username: "", phone: "", password: "" })
    }
  }
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeMember) return
    setError("")
    setIsLoading(true)
    
    const res = await updateMember(activeMember.id, {
      name: formData.name,
      username: formData.username,
      phone: formData.phone,
    })
    
    setIsLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setMembers(members.map(m => m.id === activeMember.id ? { ...m, name: formData.name, username: formData.username, phone: formData.phone || null } : m))
      setIsEditOpen(false)
    }
  }
  
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeMember) return
    setError("")
    setIsLoading(true)
    
    const res = await resetPassword(activeMember.id, formData.password)
    
    setIsLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setIsResetOpen(false)
    }
  }
  
  const handleToggleActive = async (member: Member) => {
    const newStatus = !member.isActive
    const res = await setActive(member.id, newStatus)
    if (res.success) {
      setMembers(members.map(m => m.id === member.id ? { ...m, isActive: newStatus } : m))
    }
  }
  
  const openEdit = (member: Member) => {
    setActiveMember(member)
    setFormData({ name: member.name, username: member.username, phone: member.phone || "", password: "" })
    setError("")
    setIsEditOpen(true)
  }
  
  const openReset = (member: Member) => {
    setActiveMember(member)
    setFormData({ name: "", username: "", phone: "", password: "" })
    setError("")
    setIsResetOpen(true)
  }

  const openAdd = () => {
    // Generate a random password of 8 characters
    const randomPass = Math.random().toString(36).slice(-8)
    setFormData({ name: "", username: "", phone: "", password: randomPass })
    setError("")
    setIsAddOpen(true)
  }

  const RoleBadge = ({ role }: { role: string }) => {
    switch (role) {
      case "ADMIN": return <Badge variant="destructive">Admin</Badge>
      case "MANAGER": return <Badge className="bg-orange-500">Manager</Badge>
      default: return <Badge variant="secondary">Member</Badge>
    }
  }
  
  const StatusBadge = ({ isActive }: { isActive: boolean }) => {
    return isActive ? <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge> 
                    : <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
  }
  
  const ActionMenu = ({ member }: { member: Member }) => (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 outline-none">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuItem onClick={() => openEdit(member)}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openReset(member)}>
          <Key className="mr-2 h-4 w-4" /> Reset Password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleToggleActive(member)}>
          {member.isActive ? (
            <><PowerOff className="mr-2 h-4 w-4" /> Deactivate</>
          ) : (
            <><Power className="mr-2 h-4 w-4" /> Activate</>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Members</h2>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} className={!member.isActive ? "opacity-50" : ""}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.username}</TableCell>
                <TableCell>{member.phone || "-"}</TableCell>
                <TableCell><RoleBadge role={member.role} /></TableCell>
                <TableCell><StatusBadge isActive={member.isActive} /></TableCell>
                <TableCell><ActionMenu member={member} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {members.map((member) => (
          <Card key={member.id} className={!member.isActive ? "opacity-50" : ""}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">{member.name}</CardTitle>
                <div className="text-sm text-muted-foreground">@{member.username}</div>
              </div>
              <ActionMenu member={member} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mt-2">
                <RoleBadge role={member.role} />
                <StatusBadge isActive={member.isActive} />
              </div>
              {member.phone && <div className="text-sm mt-2 text-muted-foreground">{member.phone}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Create a new user account. A random password has been generated, but you can change it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="add-name">Name</Label>
              <Input id="add-name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-username">Username</Label>
              <Input id="add-username" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone (optional)</Label>
              <Input id="add-phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Temporary Password</Label>
              <Input id="add-password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>Update details for {activeMember?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input id="edit-username" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone (optional)</Label>
              <Input id="edit-phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for {activeMember?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetSubmit} className="space-y-4">
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <Input id="reset-password" required minLength={6} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
