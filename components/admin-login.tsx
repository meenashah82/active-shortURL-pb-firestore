"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Eye, EyeOff } from "lucide-react"
import { authenticateAdmin, setSession, type AdminUser } from "@/lib/admin-auth"

interface AdminLoginProps {
  onLogin: (user: AdminUser) => void
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await authenticateAdmin(username, password)

      if (result.success && result.user) {
        setSession(result.user)
        onLogin(result.user)
      } else {
        setError(result.message || "Invalid username or password")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError(error instanceof Error ? error.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Purple header bar like wodify.com */}
      <div className="py-3" style={{ backgroundColor: "#833ADF", color: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F22C7C" }}>
              <Shield className="h-5 w-5" style={{ color: "#FFFFFF" }} />
            </div>
            <span className="text-lg font-semibold">Admin Portal</span>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex items-center justify-center px-4 py-16">
        <Card
          className="w-full max-w-md border shadow-sm"
          style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}
        >
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "#F22C7C" }}
              >
                <Shield className="h-8 w-8" style={{ color: "#FFFFFF" }} />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold" style={{ color: "#4D475B" }}>
                Admin Login
              </CardTitle>
              <CardDescription style={{ color: "#94909C" }}>Sign in to access the admin dashboard</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium" style={{ color: "#4D475B" }}>
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Enter your username"
                  className="h-11"
                  style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium" style={{ color: "#4D475B" }}>
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Enter your password"
                    className="h-11 pr-10"
                    style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    style={{ color: "#94909C" }}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert
                  variant="destructive"
                  style={{ borderColor: "#F22C7C", backgroundColor: "rgba(242, 44, 124, 0.1)" }}
                >
                  <AlertDescription style={{ color: "#F22C7C" }}>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={isLoading}
                style={{ backgroundColor: "#833ADF", color: "#FFFFFF" }}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
