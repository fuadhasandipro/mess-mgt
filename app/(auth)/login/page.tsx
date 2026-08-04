"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, UtensilsCrossed } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await signIn("credentials", {
        redirect: false,
        username,
        password,
      })

      if (res?.error) {
        const errorMessage = res.error === "CredentialsSignin" ? "Invalid username or password" : res.error
        setError(errorMessage)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - branding/hero (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/20 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-black/20 blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-primary-foreground p-12 max-w-xl text-center">
          <div className="mx-auto w-20 h-20 bg-primary-foreground/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm border border-primary-foreground/30 shadow-2xl">
            <UtensilsCrossed className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold mb-6 tracking-tight leading-tight">Manage Your Mess with Ease</h1>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            Track meals, manage expenses, and keep everyone's balances synchronized in one beautiful platform.
          </p>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-10">
          
          {/* Mobile logo header */}
          <div className="flex flex-col items-center lg:hidden space-y-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Mess Manager</h1>
          </div>

          <div className="space-y-3 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground text-lg">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-lg flex items-center gap-2">
                <span className="font-semibold block sm:inline">{error}</span>
              </div>
            )}
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-base font-medium">Username</Label>
                <Input 
                  id="username" 
                  placeholder="Enter your username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 px-4 text-base bg-muted/50 focus-visible:bg-background transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-base font-medium">Password</Label>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 px-4 text-base bg-muted/50 focus-visible:bg-background transition-colors pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-medium transition-all" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in to Dashboard"}
            </Button>

            <p className="text-sm text-center text-muted-foreground mt-8">
              Forgot your password? <span className="text-foreground font-medium">Contact your mess admin.</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
