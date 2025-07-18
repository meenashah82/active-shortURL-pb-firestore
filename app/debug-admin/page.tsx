"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, User, Calendar, Clock, RefreshCw } from "lucide-react"
import { getAllAdminUsers, type AdminUser } from "@/lib/admin-auth"

export default function DebugAdminPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAdminUsers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const users = await getAllAdminUsers()
      setAdminUsers(users)

      if (users.length === 0) {
        setError("No admin users found. Run the create-first-admin script first.")
      }
    } catch (err) {
      setError("Failed to fetch admin users. Check your Firebase configuration.")
      console.error("Error fetching admin users:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Users Debug</h1>
          </div>
          <p className="text-gray-600">Check if admin users have been created and view their details.</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Admin Users in Database
              <Button onClick={fetchAdminUsers} disabled={isLoading} size="sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </CardTitle>
            <CardDescription>Click refresh to check for admin users in your Firebase database.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {adminUsers.length === 0 && !error && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Click "Refresh" to check for admin users</p>
              </div>
            )}

            {adminUsers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Found {adminUsers.length} admin user{adminUsers.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {adminUsers.map((user, index) => (
                  <Card key={user.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <h3 className="font-semibold text-lg">{user.username}</h3>
                            <p className="text-gray-600 text-sm">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant={user.role === "superadmin" ? "default" : "secondary"}>
                            {user.role === "superadmin" ? "Super Admin" : "Admin"}
                          </Badge>
                          <Badge variant={user.isActive ? "default" : "destructive"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Created:</span>
                          <span>{new Date(user.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Last Login:</span>
                          <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-semibold">1</span>
              </div>
              <div>
                <p className="font-medium">Test Login</p>
                <p className="text-sm text-gray-600">
                  Go to <code className="bg-gray-100 px-1 rounded">/admin</code> and try logging in with your
                  credentials.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-semibold">2</span>
              </div>
              <div>
                <p className="font-medium">Change Default Password</p>
                <p className="text-sm text-gray-600">
                  After first login, immediately change the default password for security.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-semibold">3</span>
              </div>
              <div>
                <p className="font-medium">Create Additional Admins</p>
                <p className="text-sm text-gray-600">
                  Use the User Management tab in the admin panel to create additional admin users.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
