"use client"

import { useState, useEffect } from "react"
import { AdminLogin } from "@/components/admin-login"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AdminUserManagement } from "@/components/admin-user-management"
import { getSession, clearSession, type AdminUser } from "@/lib/admin-auth"
import { getFirebase } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Shield, Link, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [displayUsername, setDisplayUsername] = useState<string>("")

  useEffect(() => {
    const loadUserData = async () => {
      const session = getSession()
      if (session) {
        // Create user object from session
        const sessionUser: AdminUser = {
          id: session.userId,
          username: session.username,
          email: "", // Not stored in session
          role: session.role,
          isActive: true,
          createdAt: "",
        }
        setUser(sessionUser)

        // Fetch the actual username from Firestore
        try {
          const { db } = getFirebase()
          if (db) {
            const userDoc = await getDoc(doc(db, "admins", session.userId))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              setDisplayUsername(userData.username || session.username)
            } else {
              setDisplayUsername(session.username)
            }
          } else {
            setDisplayUsername(session.username)
          }
        } catch (error) {
          console.error("Error fetching username from Firestore:", error)
          setDisplayUsername(session.username)
        }
      }
      setIsLoading(false)
    }

    loadUserData()
  }, [])

  const handleLogin = (loggedInUser: AdminUser) => {
    setUser(loggedInUser)
    setDisplayUsername(loggedInUser.username)
  }

  const handleLogout = () => {
    clearSession()
    setUser(null)
    setDisplayUsername("")
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-12 w-1/4 mb-4" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full mt-4" />
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
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{displayUsername}</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {user.role}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
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
            <TabsTrigger value="urls">
              <Link className="mr-2 h-4 w-4" />
              URL Management
            </TabsTrigger>
            <TabsTrigger value="users">
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
