"use client"

import { useState, useEffect } from "react"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AdminUserManagement } from "@/components/admin-user-management"
import { getSession, clearSession, type AdminUser } from "@/lib/admin-auth"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Shield, Link, Users } from 'lucide-react'
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
      <div className="min-h-screen bg-white">
        <div className="bg-purple-600 text-white py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-48 bg-purple-500" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-12 w-1/4 mb-4" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full mt-4" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-purple-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-white">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-purple-100">
                Welcome, <span className="font-medium text-white">{user.username}</span>
                <span className="ml-2 px-2 py-1 bg-pink-500 text-white rounded-full text-xs font-medium">
                  {user.role}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-purple-300 text-white hover:bg-purple-700 hover:border-purple-400 bg-transparent"
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
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger value="urls" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Link className="mr-2 h-4 w-4" />
              URL Management
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
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
