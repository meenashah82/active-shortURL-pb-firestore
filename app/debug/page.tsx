"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Shield, User, CheckCircle, XCircle, RefreshCw, Database, AlertTriangle, Settings, Globe } from "lucide-react"

interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  isActive: boolean
  createdAt: any
  lastLogin?: any
}

interface DebugInfo {
  firebaseConnected: boolean
  environmentVars: Record<string, boolean>
  adminUsers: AdminUser[]
  error?: string
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const checkEnvironmentVariables = () => {
    return {
      NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
  }

  const runDiagnostics = async () => {
    try {
      setLoading(true)

      const envVars = checkEnvironmentVariables()
      let firebaseConnected = false
      const adminUsers: AdminUser[] = []
      let error: string | undefined

      try {
        // Test Firebase connection by trying to read admin users
        const adminsRef = collection(db, "admins")
        const snapshot = await getDocs(adminsRef)
        firebaseConnected = true

        snapshot.forEach((doc) => {
          const data = doc.data()
          adminUsers.push({
            id: doc.id,
            username: data.username || doc.id,
            email: data.email || "No email",
            role: data.role || "unknown",
            isActive: data.isActive ?? true,
            createdAt: data.createdAt,
            lastLogin: data.lastLogin,
          })
        })
      } catch (err) {
        console.error("Firebase connection error:", err)
        error = err instanceof Error ? err.message : "Firebase connection failed"
      }

      setDebugInfo({
        firebaseConnected,
        environmentVars: envVars,
        adminUsers,
        error,
      })
    } catch (err) {
      console.error("Diagnostics error:", err)
      setDebugInfo({
        firebaseConnected: false,
        environmentVars: checkEnvironmentVariables(),
        adminUsers: [],
        error: err instanceof Error ? err.message : "Diagnostics failed",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
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
          <p className="text-gray-600">Running diagnostics...</p>
        </div>
      </div>
    )
  }

  if (!debugInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Failed to run diagnostics</p>
          <Button onClick={runDiagnostics} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const allEnvVarsPresent = Object.values(debugInfo.environmentVars).every(Boolean)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">System Diagnostics</h1>
          </div>
          <p className="text-gray-600">Debug your URL shortener application and identify issues</p>
          <Button onClick={runDiagnostics} variant="outline" className="mt-4 bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Diagnostics
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Environment Variables
              </CardTitle>
              <CardDescription>Firebase configuration status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(debugInfo.environmentVars).map(([key, present]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-mono">{key}</span>
                    {present ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Set
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Missing
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {!allEnvVarsPresent && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Missing environment variables!</strong>
                    <br />
                    Add the missing Firebase configuration variables to your Vercel environment settings.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Firebase Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Firebase Connection
              </CardTitle>
              <CardDescription>Database connectivity status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Connection Status</span>
                {debugInfo.firebaseConnected ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                  </Badge>
                )}
              </div>

              {debugInfo.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Connection Error:</strong>
                    <br />
                    <code className="text-xs">{debugInfo.error}</code>
                  </AlertDescription>
                </Alert>
              )}

              {debugInfo.firebaseConnected && (
                <div className="text-sm text-green-600">✅ Successfully connected to Firestore database</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin Users */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Users ({debugInfo.adminUsers.length})
            </CardTitle>
            <CardDescription>
              {debugInfo.firebaseConnected
                ? `Found ${debugInfo.adminUsers.length} admin user(s) in the database`
                : "Cannot check admin users - Firebase connection failed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {debugInfo.adminUsers.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Admin Users Found</h3>
                <p className="text-gray-600 mb-4">You need to create the first super admin user.</p>

                <Alert className="max-w-md mx-auto">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>To create the first admin user:</strong>
                    <br />
                    1. Clone your repository locally
                    <br />
                    2. Run: <code className="bg-gray-100 px-1 rounded">npx tsx scripts/create-first-admin.ts</code>
                    <br />
                    3. Or use the admin creation form at <code className="bg-gray-100 px-1 rounded">/admin</code>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-4">
                {debugInfo.adminUsers.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{user.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === "superadmin" ? "default" : "secondary"}>{user.role}</Badge>
                        {user.isActive ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <strong>Email:</strong> {user.email}
                      </div>
                      <div>
                        <strong>Created:</strong> {formatDate(user.createdAt)}
                      </div>
                      <div>
                        <strong>Last Login:</strong> {formatDate(user.lastLogin)}
                      </div>
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
            <CardTitle>Quick Actions & Solutions</CardTitle>
            <CardDescription>Common fixes for deployment issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Environment Variables Missing?</h4>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Go to your Vercel dashboard</li>
                  <li>Select your project</li>
                  <li>Go to Settings → Environment Variables</li>
                  <li>Add all Firebase config variables</li>
                  <li>Redeploy your application</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-lg">No Admin Users?</h4>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Clone your repository locally</li>
                  <li>
                    Install dependencies: <code className="bg-gray-100 px-1 rounded">npm install</code>
                  </li>
                  <li>
                    Create admin:{" "}
                    <code className="bg-gray-100 px-1 rounded">npx tsx scripts/create-first-admin.ts</code>
                  </li>
                  <li>
                    Test login at <code className="bg-gray-100 px-1 rounded">/admin</code>
                  </li>
                </ol>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Default Admin Credentials</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>
                  <strong>Username:</strong> superadmin
                </div>
                <div>
                  <strong>Password:</strong> changeme123
                </div>
                <div className="text-xs mt-2 text-blue-600">⚠️ Change the password immediately after first login!</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
