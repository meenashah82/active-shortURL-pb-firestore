"use client"

import { useState, useEffect } from "react"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AdminUserManagement } from "@/components/admin-user-management"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Shield, Users, BarChart3 } from "lucide-react"
import { getAdminById, isSessionValid, type AdminUser, type AdminSession } from "@/lib/admin-auth"

export default function AdminPage() {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const sessionData = localStorage.getItem("admin_session")
      if (!sessionData) {
        setIsLoading(false)
        return
      }

      const session: AdminSession = JSON.parse(sessionData)

      if (!isSessionValid(session)) {
        localStorage.removeItem("admin_session")
        setIsLoading(false)
        return
      }

      const admin = await getAdminById(session.adminId)
      if (admin && admin.isActive) {
        setCurrentAdmin(admin)
      } else {
        localStorage.removeItem("admin_session")
      }
    } catch (error) {
      console.error("Session check failed:", error)
      localStorage.removeItem("admin_session")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (admin: AdminUser) => {
    setCurrentAdmin(admin)
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_session")
    setCurrentAdmin(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentAdmin) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Make Short URL</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{currentAdmin.username}</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {currentAdmin.role === "super_admin" ? "Super Admin" : "Admin"}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              URL Management
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="users">
            <AdminUserManagement currentAdmin={currentAdmin} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
