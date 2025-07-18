"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Shield, Link, Users } from "lucide-react"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AdminUserManagement } from "@/components/admin-user-management"
import { getSession, clearSession, type AdminUser } from "@/lib/admin-auth"

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (session) {
      // Create a user object from session data
      const sessionUser: AdminUser = {
        id: session.userId,
        username: session.username,
        email: "", // We don't store email in session
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{user.username}</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {user.role === "superadmin" ? "Super Admin" : "Admin"}
                </span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="urls" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="urls" className="flex items-center space-x-2">
              <Link className="h-4 w-4" />
              <span>URL Management</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="urls" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>URL Management</CardTitle>
                <CardDescription>Manage all shortened URLs in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUserManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
