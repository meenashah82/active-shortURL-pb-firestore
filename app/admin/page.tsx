"use client"

import { useState, useEffect } from "react"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AdminUserManagement } from "@/components/admin-user-management"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSession, clearSession, type AdminUser } from "@/lib/admin-auth"
import { LogOut, Shield, Users } from "lucide-react"
import { toast } from "sonner"

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (session) {
      // Convert session to AdminUser format
      const user: AdminUser = {
        id: session.userId,
        username: session.username,
        email: "", // We don't store email in session, but it's not needed for display
        role: session.role,
        isActive: true,
        createdAt: "",
      }
      setCurrentUser(user)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (user: AdminUser) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    clearSession()
    setCurrentUser(null)
    toast.success("Logged out successfully")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!currentUser) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {currentUser.username} ({currentUser.role})
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="urls" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="urls" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>URL Management</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex items-center space-x-2"
              disabled={currentUser.role !== "superadmin"}
            >
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="urls" className="space-y-6">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUserManagement currentUser={currentUser} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
