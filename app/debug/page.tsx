"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Users } from "lucide-react"
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
      const adminsRef = collection(db, "admins")
      const snapshot = await getDocs(adminsRef)

      const users: AdminUser[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        users.push({
          id: doc.id,
          username: data.username || doc.id,
          email: data.email || "Not set",
          role: data.role || "Unknown",
          isActive: data.isActive || false,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin,
        })
      })

      setAdminUsers(users)
    } catch (error: any) {
      console.error("Error checking admin users:", error)
      setFirebaseError(error.message || "Unknown Firebase error")
    } finally {
      setLoading(false)
    }
  }

  const allEnvVarsSet = envChecks.every((check) => check.isSet)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔧 Debug Dashboard</h1>
        <p className="text-muted-foreground">Diagnose issues with your URL shortener application</p>
      </div>

      {/* Environment Variables Check */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Environment Variables
          </CardTitle>
          <CardDescription>Firebase configuration environment variables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {envChecks.map((check) => (
              <div key={check.name} className="flex items-center justify-between">
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
                Some environment variables are missing. Make sure they are set in your Vercel dashboard under Settings →
                Environment Variables.
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
          </CardTitle>
          <CardDescription>Test connection to Firebase Firestore</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span>Firestore Database</span>
            <div className="flex items-center gap-2">
              {loading ? (
                <>
                  <Badge variant="secondary">Testing...</Badge>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                </>
              ) : firebaseError ? (
                <>
                  <Badge variant="destructive">Error</Badge>
                  <XCircle className="h-4 w-4 text-red-600" />
                </>
              ) : (
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
                Common solutions:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Check your Firebase configuration</li>
                  <li>Verify Firestore security rules</li>
                  <li>Ensure your Firebase project is active</li>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Users
          </CardTitle>
          <CardDescription>Check if admin users exist in the database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading admin users...
            </div>
          ) : adminUsers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>No admin users found!</strong>
                <br />
                You need to create the first super admin user. Run this command locally:
                <br />
                <code className="bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                  npx tsx scripts/create-first-admin.ts
                </code>
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
                    <p>Email: {user.email}</p>
                    <p>
                      Created: {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleString() : "Unknown"}
                    </p>
                    <p>
                      Last Login: {user.lastLogin ? new Date(user.lastLogin.seconds * 1000).toLocaleString() : "Never"}
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
                  Default credentials: <strong>superadmin</strong> / <strong>changeme123</strong>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
