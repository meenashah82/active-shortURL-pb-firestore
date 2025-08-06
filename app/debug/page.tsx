"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Database, Shield } from "lucide-react"
import { db } from "@/lib/firebase"
import { createAdminUser, getAllAdminUsers } from "@/lib/admin-auth"

export default function DebugPage() {
  const [firebaseStatus, setFirebaseStatus] = useState<"checking" | "connected" | "error">("checking")
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)
  const [message, setMessage] = useState<string>("")

  const checkFirebaseConnection = async () => {
    try {
      if (!db) {
        setFirebaseStatus("error")
        setMessage("Firebase database not initialized")
        return
      }

      // Try to fetch admin users to test connection
      const users = await getAllAdminUsers()
      setAdminUsers(users)
      setFirebaseStatus("connected")
      setMessage(`Firebase connected successfully. Found ${users.length} admin users.`)
    } catch (error) {
      console.error("Firebase connection error:", error)
      setFirebaseStatus("error")
      setMessage(`Firebase error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const createFirstAdmin = async () => {
    setIsCreatingAdmin(true)
    try {
      await createAdminUser("superadmin", "admin@example.com", "changeme123", "superadmin")
      setMessage("Super admin user created successfully!")
      await checkFirebaseConnection() // Refresh the list
    } catch (error) {
      console.error("Error creating admin:", error)
      setMessage(`Error creating admin: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsCreatingAdmin(false)
    }
  }

  useEffect(() => {
    checkFirebaseConnection()
  }, [])

  const envVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">System Debug</h1>
          <p className="text-gray-600 mt-2">Check system status and configuration</p>
        </div>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Environment Variables</span>
            </CardTitle>
            <CardDescription>Firebase configuration status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {envVars.map((envVar) => {
                const value = process.env[envVar]
                const isSet = !!value
                return (
                  <div key={envVar} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-mono text-sm">{envVar}</span>
                    <div className="flex items-center space-x-2">
                      {isSet ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <Badge variant="default">Set</Badge>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <Badge variant="destructive">Missing</Badge>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Firebase Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Firebase Connection</span>
            </CardTitle>
            <CardDescription>Database connectivity status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {firebaseStatus === "checking" && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Checking connection...</span>
                  </>
                )}
                {firebaseStatus === "connected" && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Connected</span>
                  </>
                )}
                {firebaseStatus === "error" && (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Connection Failed</span>
                  </>
                )}
              </div>
              <Button onClick={checkFirebaseConnection} variant="outline" size="sm">
                Recheck
              </Button>
            </div>
            {message && (
              <Alert className="mt-4">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Admin Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Admin Users</span>
            </CardTitle>
            <CardDescription>Current admin user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {adminUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No admin users found</p>
                <Button onClick={createFirstAdmin} disabled={isCreatingAdmin || firebaseStatus !== "connected"}>
                  {isCreatingAdmin ? "Creating..." : "Create First Super Admin"}
                </Button>
                <p className="text-sm text-gray-500 mt-2">Username: superadmin, Password: changeme123</p>
              </div>
            ) : (
              <div className="space-y-2">
                {adminUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-medium">{user.username}</span>
                      <span className="text-gray-500 ml-2">({user.email})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role === "superadmin" ? "default" : "secondary"}>{user.role}</Badge>
                      <Badge variant={user.isActive ? "default" : "destructive"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common debugging and setup tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => window.open("/admin", "_blank")}
                disabled={firebaseStatus !== "connected" || adminUsers.length === 0}
              >
                Open Admin Panel
              </Button>
              <Button onClick={() => window.open("/", "_blank")} variant="outline">
                Open Main Site
              </Button>
              <Button onClick={checkFirebaseConnection} variant="outline">
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
