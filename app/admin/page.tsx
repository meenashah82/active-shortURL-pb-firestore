"use client"

import { useState, useEffect } from "react"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AdminUserManagement } from "@/components/admin-user-management"
import { getSession, clearSession, type AdminUser } from "@/lib/admin-auth"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Shield, Link, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (session) {
      // A simple user object from session data for display purposes
      const sessionUser: AdminUser = {
        id: session.userId,
        username: session.username,
        email: "", // Not stored in session
        role: session.role,
        isActive: true,
        createdAt: "",
      }
      setUser(sessionUser)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (loggedInUser: AdminUser) => {
    setUser(loggedInUser)
  }

  const handleLogout = () => {
    clearSession()
    setUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="py-4" style={{ backgroundColor: "#833ADF", color: "#FFFFFF" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-48" style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }} />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-12 w-1/4 mb-4" style={{ backgroundColor: "#D9D8FD" }} />
          <Skeleton className="h-8 w-full" style={{ backgroundColor: "#D9D8FD" }} />
          <Skeleton className="h-64 w-full mt-4" style={{ backgroundColor: "#D9D8FD" }} />
        </div>
      </div>
    )
  }

  if (!user) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <header className="shadow-sm" style={{ backgroundColor: "#833ADF", color: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#F22C7C" }}
              >
                <Shield className="h-5 w-5" style={{ color: "#FFFFFF" }} />
              </div>
              <h1 className="text-xl font-semibold" style={{ color: "#FFFFFF" }}>
                Admin Panel
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                Welcome,{" "}
                <span className="font-medium" style={{ color: "#FFFFFF" }}>
                  {user.username}
                </span>
                <span
                  className="ml-2 px-2 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "#F22C7C", color: "#FFFFFF" }}
                >
                  {user.role}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                style={{
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "#FFFFFF",
                  backgroundColor: "transparent",
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="urls" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2" style={{ backgroundColor: "#D9D8FD" }}>
            <TabsTrigger
              value="urls"
              className="data-[state=active]:text-white"
              style={{
                color: "#4D475B",
                backgroundColor: "transparent",
              }}
            >
              <Link className="mr-2 h-4 w-4" />
              URL Management
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:text-white"
              style={{
                color: "#4D475B",
                backgroundColor: "transparent",
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              User Management
            </TabsTrigger>
          </TabsList>
          <TabsContent value="urls">
            <AdminDashboard />
          </TabsContent>
          <TabsContent value="users">
            <AdminUserManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
