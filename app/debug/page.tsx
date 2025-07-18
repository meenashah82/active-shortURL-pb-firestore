"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Users, Settings, Globe } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface EnvironmentCheck {
  name: string
  value: string | undefined
  isSet: boolean
}

interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  isActive: boolean
  createdAt: any
  lastLogin: any
}

export default function DebugPage() {
  const [envChecks, setEnvChecks] = useState<EnvironmentCheck[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [firebaseError, setFirebaseError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"testing" | "connected" | "error">("testing")

  const requiredEnvVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ]

  useEffect(() => {
    checkEnvironment()
    checkAdminUsers()
  }, [])

  const checkEnvironment = () => {
    const checks = requiredEnvVars.map((varName) => ({
      name: varName,
      value: process.env[varName],
      isSet: !!process.env[varName],
    }))
    setEnvChecks(checks)
  }

  const checkAdminUsers = async () => {
    try {
      setFirebaseError(null)
      setConnectionStatus("testing")

      const adminsRef = collection(db, "admins")
      const snapshot = await getDocs(adminsRef)

      setConnectionStatus("connected")

      const users: AdminUser[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        users.push({
          id: doc.id,
          username: data.username || doc.id,
          email: data.email || "Not set",
          role: data.role || "Unknown",
          isActive: data.isActive !== false,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin,
        })
      })

      setAdminUsers(users)
    } catch (error: any) {
      console.error("Error checking admin users:", error)
      setFirebaseError(error.message || "Unknown Firebase error")
      setConnectionStatus("error")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Never"
    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString()
      } else if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString()
      } else {
        return new Date(timestamp).toLocaleString()
      }
    } catch {
      return "Invalid date"
    }
  }

  const allEnvVarsSet = envChecks.every((check) => check.isSet)
  const missingEnvVars = envChecks.filter((check) => !check.isSet)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">🔧 Debug Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Diagnose issues with your URL shortener application</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh All Checks
        </Button>
      </div>

      {/* Environment Variables Check */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Environment Variables
            {allEnvVarsSet ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                All Set
              </Badge>
            ) : (
              <Badge variant="destructive">{missingEnvVars.length} Missing</Badge>
            )}
          </CardTitle>
          <CardDescription>Firebase configuration environment variables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {envChecks.map((check) => (
              <div key={check.name} className="flex items-center justify-between p-2 border rounded">
                <span className="font-mono text-sm">{check.name}</span>
                <div className="flex items-center gap-2">
                  {check.isSet ? (
                    <>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Set
                      </Badge>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </>
                  ) : (
                    <>
                      <Badge variant="destructive">Missing</Badge>
                      <XCircle className="h-4 w-4 text-red-600" />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!allEnvVarsSet && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Missing environment variables detected!</strong>
                <br />
                <br />
                <strong>For Vercel deployment:</strong>
                <br />
                1. Go to your Vercel dashboard
                <br />
                2. Select your project → Settings → Environment Variables
                <br />
                3. Add the missing variables
                <br />
                4. Redeploy your application
                <br />
                <br />
                <strong>For local development:</strong>
                <br />
                1. Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file
                <br />
                2. Copy your Firebase config from Vercel
                <br />
                3. Run <code className="bg-gray-100 px-1 rounded">npm install</code>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Firebase Connection Check */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Firebase Connection
            {connectionStatus === "connected" && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            )}
            {connectionStatus === "error" && <Badge variant="destructive">Error</Badge>}
            {connectionStatus === "testing" && <Badge variant="secondary">Testing...</Badge>}
          </CardTitle>
          <CardDescription>Test connection to Firebase Firestore</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span>Firestore Database</span>
            <div className="flex items-center gap-2">
              {connectionStatus === "testing" && (
                <>
                  <Badge variant="secondary">Testing...</Badge>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                </>
              )}
              {connectionStatus === "error" && (
                <>
                  <Badge variant="destructive">Error</Badge>
                  <XCircle className="h-4 w-4 text-red-600" />
                </>
              )}
              {connectionStatus === "connected" && (
                <>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Connected
                  </Badge>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </>
              )}
            </div>
          </div>

          {firebaseError && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Firebase Error:</strong> {firebaseError}
                <br />
                <br />
                <strong>Common solutions:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Check your Firebase configuration in environment variables</li>
                  <li>Verify your Firebase project is active and billing is enabled</li>
                  <li>Check Firestore security rules (allow read/write for testing)</li>
                  <li>Ensure your API key has the correct permissions</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={checkAdminUsers} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              "Test Connection Again"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Admin Users Check */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Users
            {!loading && <Badge variant="secondary">{adminUsers.length} found</Badge>}
          </CardTitle>
          <CardDescription>Check if admin users exist in the database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading admin users...
            </div>
          ) : connectionStatus === "error" ? (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Cannot check admin users due to Firebase connection error. Fix the connection issue above first.
              </AlertDescription>
            </Alert>
          ) : adminUsers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>No admin users found!</strong>
                <br />
                You need to create the first super admin user.
                <br />
                <br />
                <strong>Steps to create admin user:</strong>
                <br />
                1. Clone your repository locally
                <br />
                2. Run: <code className="bg-gray-100 px-2 py-1 rounded">npm install</code>
                <br />
                3. Create <code className="bg-gray-100 px-1 rounded">.env.local</code> with Firebase config
                <br />
                4. Run: <code className="bg-gray-100 px-2 py-1 rounded">npm run create-admin</code>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Found {adminUsers.length} admin user(s)</span>
              </div>

              {adminUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{user.username}</h3>
                    <div className="flex gap-2">
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                      <strong>Created:</strong> {formatDate(user.createdAt)}
                    </p>
                    <p>
                      <strong>Last Login:</strong> {formatDate(user.lastLogin)}
                    </p>
                  </div>
                </div>
              ))}

              <Separator />

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Admin system is working!</strong>
                  <br />
                  You can login at <strong>/admin</strong> with your admin credentials.
                  <br />
                  <br />
                  <strong>Default credentials (if using setup script):</strong>
                  <br />
                  Username: <code className="bg-gray-100 px-1 rounded">superadmin</code>
                  <br />
                  Password: <code className="bg-gray-100 px-1 rounded">changeme123</code>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Step-by-step guide to fix common issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-lg">🔧 Local Development Setup</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Clone your repository locally</li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">npm install</code>
                </li>
                <li>
                  Create <code className="bg-gray-100 px-1 rounded">.env.local</code> file
                </li>
                <li>Copy Firebase config from Vercel</li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">npm run create-admin</code>
                </li>
                <li>
                  <code className="bg-gray-100 px-1 rounded">npm run dev</code>
                </li>
              </ol>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-lg">🚀 Production Deployment</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Go to Vercel dashboard</li>
                <li>Select your project</li>
                <li>Settings → Environment Variables</li>
                <li>Add all Firebase config variables</li>
                <li>Redeploy your application</li>
                <li>Create admin user locally</li>
              </ol>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🔑 Default Admin Credentials</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div>
                <strong>Username:</strong> superadmin
              </div>
              <div>
                <strong>Password:</strong> changeme123
              </div>
              <div>
                <strong>Login URL:</strong> /admin
              </div>
              <div className="text-xs mt-2 text-blue-600">⚠️ Change the password immediately after first login!</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
