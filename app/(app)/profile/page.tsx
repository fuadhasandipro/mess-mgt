import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { ProfileClient } from "@/components/profile/profile-client"

export default async function ProfilePage() {
  const session = await requireRole(["ADMIN", "MANAGER", "MEMBER"])
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { mess: { select: { name: true } } }
  })

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">Manage your personal account settings.</p>
      </div>

      <ProfileClient 
        user={{
          name: user.name,
          username: user.username,
          role: user.role,
          phone: user.phone,
          messName: user.mess.name
        }} 
      />
    </div>
  )
}
