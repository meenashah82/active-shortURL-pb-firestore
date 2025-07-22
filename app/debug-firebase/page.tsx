"use client"

import { useState, useEffect } from "react"
import { getFirebase } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DebugInfo {
  environmentVariables: Record<string, string | undefined>
  firebaseStatus: "not_initialized" | "initialized" | "error"
  firestoreStatus: "not_available" | "available" | "error"
  testResults: {
    canReadAdmins: boolean
    adminCount: number
    error?: string
  }
}

export default function DebugFirebasePage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    environmentVariables: {},
    firebaseStatus: "not_initialized",
    firestoreStatus: "not_available",
    testResults: {
      canReadAdmins: false,
      adminCount: 0,
    },
  })
  const [isLoading, setIsLoading] = useState(false)

  const runDiagnostics = async () => {
    setIsLoading(true)

    try {
      // Check environment variables
      const envVars = {
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }

      let firebaseStatus: "not_initialized" | "initialized" | "error" = "not_initialized"
      let firestoreStatus: "not_available" | "available" | "error" = "not_available"
      const testResults = {
        canReadAdmins: false,
        adminCount: 0,
        error: undefined as string | undefined,
      }

      try {
        // Test Firebase initialization
        const { app, db } = getFirebase()

        if (app) {
          firebaseStatus = "initialized"
          console.log("Firebase app initialized successfully")
        } else {
          firebaseStatus = "error"
          console.error("Firebase app failed to initialize")
        }

        if (db) {
          firestoreStatus = "available"
          console.log("Firestore is available")

          // Test reading from admins collection
          try {
            const adminsCollection = collection(db, "admins")
            const snapshot = await getDocs(adminsCollection)
            testResults.canReadAdmins = true
            testResults.adminCount = snapshot.size
            console.log(`Successfully read ${snapshot.size} admin documents`)
          } catch (readError: any) {
            testResults.error = readError.message
            console.error("Error reading admins collection:", readError)
          }
        } else {
          firestoreStatus = "error"
          testResults.error = "Firestore database is not available"
          console.error("Firestore is not available")
        }
      } catch (initError: any) {
        firebaseStatus = "error"
        firestoreStatus = "error"
        testResults.error = initError.message
        console.error("Firebase initialization error:", initError)
      }

      setDebugInfo({
        environmentVariables: envVars,
        firebaseStatus,
        firestoreStatus,
        testResults,
      })
    } catch (error: any) {
      console.error("Debug diagnostics error:", error)
      setDebugInfo((prev) => ({
        ...prev,
        testResults: {
          canReadAdmins: false,
          adminCount: 0,
          error: error.message,
        },
      }))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "initialized":
      case "available":
        return (
          <Badge variant="default" className="bg-green-500">
            ✓ Working
          </Badge>
        )
      case "error":
      case "not_available":
        return <Badge variant="destructive">✗ Error</Badge>
      case "not_initialized":
        return <Badge variant="secondary">⚠ Not Initialized</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Firebase Debug Console</h1>
          <p className="text-muted-foreground">Diagnose Firebase configuration and connectivity issues</p>
        </div>
        <Button onClick={runDiagnostics} disabled={isLoading}>
          {isLoading ? "Running..." : "Run Diagnostics"}
        </Button>
      </div>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>
            Firebase configuration from your Vercel environment variables. The PROJECT ID should match your Firebase
            console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(debugInfo.environmentVariables).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                <code className="text-sm font-mono">{key}</code>
                <div className="flex items-center gap-2">
                  {value ? (
                    <>
                      <Badge variant="default" className="bg-green-500">
                        ✓ Set
                      </Badge>
                      <code className="text-xs text-muted-foreground">
                        {key === "NEXT_PUBLIC_FIREBASE_PROJECT_ID" ? value : `${value.substring(0, 10)}...`}
                      </code>
                    </>
                  ) : (
                    <Badge variant="destructive">✗ Missing</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Firebase Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Firebase App Status</CardTitle>
            <CardDescription>Firebase application initialization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>Firebase App</span>
              {getStatusBadge(debugInfo.firebaseStatus)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Firestore Status</CardTitle>
            <CardDescription>Firestore database connectivity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>Firestore Database</span>
              {getStatusBadge(debugInfo.firestoreStatus)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Database Test Results</CardTitle>
          <CardDescription>Results from attempting to read the admins collection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Can Read Admins Collection</span>
              {debugInfo.testResults.canReadAdmins ? (
                <Badge variant="default" className="bg-green-500">
                  ✓ Yes
                </Badge>
              ) : (
                <Badge variant="destructive">✗ No</Badge>
              )}
            </div>

            {debugInfo.testResults.canReadAdmins && (
              <div className="flex items-center justify-between">
                <span>Admin Documents Found</span>
                <Badge variant="outline">{debugInfo.testResults.adminCount}</Badge>
              </div>
            )}

            {debugInfo.testResults.error && (
              <Alert>
                <AlertDescription>
                  <strong>Error:</strong> {debugInfo.testResults.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>Since the Project IDs match, here are other potential issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {debugInfo.testResults.canReadAdmins && debugInfo.testResults.adminCount > 0 && (
              <Alert>
                <AlertDescription>
                  <strong>Good News:</strong> Firebase is working correctly! You have {debugInfo.testResults.adminCount}{" "}
                  admin user(s). The /admin page should work now.
                </AlertDescription>
              </Alert>
            )}

            {!debugInfo.environmentVariables.NEXT_PUBLIC_FIREBASE_PROJECT_ID && (
              <Alert>
                <AlertDescription>
                  <strong>Missing Environment Variables:</strong> Go to your Vercel project settings and add the missing
                  NEXT_PUBLIC_FIREBASE_* environment variables.
                </AlertDescription>
              </Alert>
            )}

            {debugInfo.firebaseStatus === "error" && (
              <Alert>
                <AlertDescription>
                  <strong>Firebase Initialization Error:</strong> Check that your environment variables are correct and
                  match your Firebase project configuration.
                </AlertDescription>
              </Alert>
            )}

            {debugInfo.firestoreStatus === "error" && (
              <Alert>
                <AlertDescription>
                  <strong>Firestore Not Available:</strong> Even though you have a database, there might be a
                  permissions issue. Check your Firestore security rules.
                </AlertDescription>
              </Alert>
            )}

            {debugInfo.testResults.canReadAdmins && debugInfo.testResults.adminCount === 0 && (
              <Alert>
                <AlertDescription>
                  <strong>No Admin Users Found:</strong> Your Firestore is working, but the admins collection is empty.
                  You need to create the first admin user.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
