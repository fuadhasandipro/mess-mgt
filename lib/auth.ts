import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

// Rate limiter configuration
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const usernameKey = credentials.username.toLowerCase()
        const now = Date.now()

        // Check rate limit
        const attempt = loginAttempts.get(usernameKey)
        if (attempt && attempt.resetAt > now && attempt.count >= MAX_ATTEMPTS) {
          throw new Error("Too many login attempts. Please try again in 15 minutes.")
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        })

        if (!user || !user.isActive) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          // Record failed attempt
          const newCount = (attempt && attempt.resetAt > now) ? attempt.count + 1 : 1
          loginAttempts.set(usernameKey, { count: newCount, resetAt: now + WINDOW_MS })
          return null
        }

        // On success, clear the rate limit for this user
        loginAttempts.delete(usernameKey)

        // Log activity asynchronously so it doesn't block the login response
        const { logActivity } = await import("@/lib/activity-log")
        logActivity({
          userId: user.id,
          messId: user.messId,
          action: "LOGIN",
        })

        return {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          messId: user.messId,
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.messId = user.messId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        session.user.messId = token.messId as string
      }
      return session
    }
  }
}

export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    redirect("/login")
  }
  
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Unauthorized Access: Missing required role.")
  }
  
  return session
}
