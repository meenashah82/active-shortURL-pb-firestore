"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

interface DebugInfo {
  envVars: { [key: string]: boolean }
  firebaseConnection: boolean
  adminUsers: any[]
  errors: string[]
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)

  const checkEnvironment = () => {
    const requiredEnvVars = [
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ]

    const envVars: { [key: string]: boolean } = {}
    requiredEnvVars.forEach((envVar) => {
      envVars[envVar] = !!process.env[envVar]
    })

    return envVars
  }

  const runDiagnostics = async () => {
    setIsLoading(true)
    const errors: string[] = []

    try {
      // Check environment variables
      const envVars = checkEnvironment()

      // Check Firebase connection
      let firebaseConnection = false
      let adminUsers: any[] = []

      try {
        const { db } = await import("@/lib/firebase")
        if (db) {
          const { getAllAdminUsers } = await import("@/lib/admin-auth")
          adminUsers = await getAllAdminUsers()
          firebaseConnection = true
        } else {
          errors.push("Firebase database not initialized")
        }
      } catch (error) {
        errors.push(`Firebase connection error: ${error}`)
      }

      setDebugInfo({
        envVars,
        firebaseConnection,
        adminUsers,
        errors,
      })
    } catch (error) {
      errors.push(`Diagnostic error: ${error}`)
      setDebugInfo({
        envVars: {},
        firebaseConnection: false,
        adminUsers: [],
        errors,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createFirstAdmin = async () => {
    setIsCreatingAdmin(true)
    try {
      const { createAdminUser } = await import("@/lib/admin-auth")
      const result = await createAdminUser({
        username: "superadmin",
        email: "admin@example.com",
        password: "changeme123",
        role: "superadmin",
      })

      if (result.success) {
        await runDiagnostics() // Refresh the data
      } else {
        alert(`Failed to create admin: ${result.message}`)
      }
    } catch (error) {
      alert(`Error creating admin: ${error}`)
    } finally {
      setIsCreatingAdmin(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Debug Dashboard</h1>
          <p className="text-gray-600 mt-2">Diagnose and fix application issues</p>
        </div>

        <div className="flex justify-center">
          <Button onClick={runDiagnostics} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Diagnostics
          </Button>
        </div>

        {debugInfo?.errors && debugInfo.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {debugInfo.errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Environment Variables</span>
                {debugInfo && Object.values(debugInfo.envVars).every(Boolean) ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
              <CardDescription>Firebase configuration status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {debugInfo &&
                Object.entries(debugInfo.envVars).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-mono">{key}</span>
                    <Badge variant={value ? "default" : "destructive"}>{value ? "Set" : "Missing"}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Firebase Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Firebase Connection</span>
                {debugInfo?.firebaseConnection ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </CardTitle>
              <CardDescription>Database connectivity status</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant={debugInfo?.firebaseConnection ? "default" : "destructive"}>
                {debugInfo?.firebaseConnection ? "Connected" : "Disconnected"}
              </Badge>
            </CardContent>
          </Card>

          {/* Admin Users */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>Admin Users</span>
                  {debugInfo && debugInfo.adminUsers.length > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                {debugInfo && debugInfo.adminUsers.length === 0 && (
                  <Button onClick={createFirstAdmin} disabled={isCreatingAdmin} size="sm">
                    {isCreatingAdmin ? "Creating..." : "Create First Admin"}
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                {debugInfo ? `${debugInfo.adminUsers.length} admin users found` : "Loading..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {debugInfo && debugInfo.adminUsers.length > 0 ? (
                <div className="space-y-2">
                  {debugInfo.adminUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{user.username}</span>
                        <span className="text-sm text-gray-500 ml-2">({user.email})</span>
                      </div>
                      <div className="space-x-2">
                        <Badge variant={user.role === "superadmin" ? "default" : "secondary"}>{user.role}</Badge>
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No admin users found. Create the first admin user to access the admin panel.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {debugInfo && debugInfo.adminUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ Ready to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Your application is properly configured! You can now:</p>
              <div className="space-y-2">
                <div>
                  • Visit{" "}
                  <a href="/admin" className="text-blue-600 hover:underline">
                    /admin
                  </a>{" "}
                  to access the admin panel
                </div>
                <div>
                  • Use username: <code className="bg-gray-100 px-1 rounded">superadmin</code>
                </div>
                <div>
                  • Use password: <code className="bg-gray-100 px-1 rounded">changeme123</code>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
