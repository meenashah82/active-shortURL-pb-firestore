"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Shield, User, Calendar, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface AdminUser {
  id: string
  username: string
  role: string
  isActive: boolean
  createdAt: any
  lastLogin?: any
}

export default function DebugAdminPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAdminUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const adminsRef = collection(db, "admins")
      const snapshot = await getDocs(adminsRef)

      const users: AdminUser[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        users.push({
          id: doc.id,
          username: data.username || doc.id,
          role: data.role || "unknown",
          isActive: data.isActive ?? true,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin,
        })
      })

      setAdminUsers(users)
    } catch (err) {
      console.error("Error loading admin users:", err)
      setError(err instanceof Error ? err.message : "Failed to load admin users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminUsers()
  }, [])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Never"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleString()
    } catch {
      return "Invalid date"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading admin users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Users Debug</h1>
          <p className="text-gray-600">Check and verify admin user accounts</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
              <br />
              <Button variant="outline" size="sm" onClick={loadAdminUsers} className="mt-2 bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Admin Users ({adminUsers.length})</h2>
            <p className="text-sm text-gray-600">
              {adminUsers.filter((u) => u.isActive).length} active, {adminUsers.filter((u) => !u.isActive).length}{" "}
              inactive
            </p>
          </div>
          <Button onClick={loadAdminUsers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {adminUsers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Admin Users Found</h3>
                <p className="text-gray-600 mb-4">You need to create the first super admin user to get started.</p>
                <div className="bg-gray-100 p-4 rounded-lg text-left max-w-md mx-auto">
                  <p className="text-sm font-medium mb-2">Run this command:</p>
                  <code className="text-sm bg-gray-800 text-green-400 p-2 rounded block">
                    npx tsx scripts/create-first-admin.ts
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {adminUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {user.username}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>{user.role}</Badge>
                      {user.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>User ID: {user.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        Created
                      </div>
                      <p className="font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        Last Login
                      </div>
                      <p className="font-medium">{formatDate(user.lastLogin)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin management tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Create First Admin</h4>
                <p className="text-sm text-gray-600 mb-3">Create the initial super admin user</p>
                <code className="text-xs bg-gray-100 p-2 rounded block">npx tsx scripts/create-first-admin.ts</code>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Test Login</h4>
                <p className="text-sm text-gray-600 mb-3">Default credentials (change after first login)</p>
                <div className="text-xs space-y-1">
                  <div>
                    <strong>Username:</strong> superadmin
                  </div>
                  <div>
                    <strong>Password:</strong> changeme123
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
