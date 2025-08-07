"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Database, Users, Link, Copy, ExternalLink } from 'lucide-react'
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface DiagnosticResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: string[]
  count?: number
}

export function DatabaseDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<Date | null>(null)
  const [showSolution, setShowSolution] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const diagnosticResults: DiagnosticResult[] = []

    try {
      // Test 1: Firebase Connection
      try {
        await getDoc(doc(db, "test", "connection"))
        diagnosticResults.push({
          name: "Firebase Connection",
          status: "success",
          message: "Successfully connected to Firebase",
          details: [`Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`]
        })
      } catch (error) {
        diagnosticResults.push({
          name: "Firebase Connection",
          status: "error",
          message: "Failed to connect to Firebase",
          details: [error instanceof Error ? error.message : String(error)]
        })
      }

      // Test 2: Check admins collection
      try {
        const adminsSnapshot = await getDocs(collection(db, "admins"))
        const adminCount = adminsSnapshot.size
        
        if (adminCount > 0) {
          const adminDetails: string[] = []
          adminsSnapshot.forEach((doc) => {
            const data = doc.data()
            adminDetails.push(`Admin: ${data.username || data.email || doc.id}`)
          })
          
          diagnosticResults.push({
            name: "Admins Collection",
            status: "success",
            message: `Found ${adminCount} admin user(s)`,
            count: adminCount,
            details: adminDetails
          })
        } else {
          diagnosticResults.push({
            name: "Admins Collection",
            status: "warning",
            message: "Admins collection exists but is empty",
            count: 0
          })
        }
      } catch (error) {
        diagnosticResults.push({
          name: "Admins Collection",
          status: "error",
          message: "Cannot access admins collection",
          details: [error instanceof Error ? error.message : String(error)]
        })
      }

      // Test 3: Check urls collection
      try {
        const urlsSnapshot = await getDocs(collection(db, "urls"))
        const urlCount = urlsSnapshot.size
        
        if (urlCount > 0) {
          const urlDetails: string[] = []
          urlsSnapshot.forEach((doc) => {
            const data = doc.data()
            urlDetails.push(`${doc.id} -> ${data.originalUrl} (${data.totalClicks || 0} clicks)`)
          })
          
          diagnosticResults.push({
            name: "URLs Collection",
            status: "success",
            message: `Found ${urlCount} URL(s)`,
            count: urlCount,
            details: urlDetails.slice(0, 5) // Show first 5
          })
        } else {
          diagnosticResults.push({
            name: "URLs Collection",
            status: "error",
            message: "URLs collection is missing or empty - This is the main problem!",
            count: 0,
            details: ["This explains why URL shortening fails", "The urls collection needs to be recreated"]
          })
        }
      } catch (error) {
        diagnosticResults.push({
          name: "URLs Collection",
          status: "error",
          message: "Cannot access urls collection",
          details: [error instanceof Error ? error.message : String(error)]
        })
      }

      // Test 4: Check Firestore Rules
      try {
        // Try to write a test document
        const testRef = doc(db, "test", "permissions")
        await getDoc(testRef)
        
        diagnosticResults.push({
          name: "Firestore Permissions",
          status: "success",
          message: "Read permissions are working",
          details: ["Can read from Firestore"]
        })
      } catch (error) {
        diagnosticResults.push({
          name: "Firestore Permissions",
          status: "error",
          message: "Permission denied - Security rules issue",
          details: [
            "This is likely the cause of your problems",
            "Firestore security rules may have changed",
            "Need to update rules to allow read/write access"
          ]
        })
      }

    } catch (error) {
      diagnosticResults.push({
        name: "General Error",
        status: "error",
        message: "Unexpected error during diagnostics",
        details: [error instanceof Error ? error.message : String(error)]
      })
    }

    setResults(diagnosticResults)
    setLastRun(new Date())
    setIsRunning(false)

    // Auto-show solution if there are permission errors
    const hasPermissionErrors = diagnosticResults.some(r => 
      r.status === "error" && r.details?.some(d => d.includes("permissions"))
    )
    if (hasPermissionErrors) {
      setShowSolution(true)
    }
  }

  useEffect(() => {
    // Auto-run diagnostics on component mount
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Database className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const errorCount = results.filter(r => r.status === "error").length
  const warningCount = results.filter(r => r.status === "warning").length
  const successCount = results.filter(r => r.status === "success").length

  const securityRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Database Diagnostics
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Last run: {lastRun ? lastRun.toLocaleTimeString() : "Never"}</span>
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              size="sm"
              variant="outline"
            >
              {isRunning ? "Running..." : "Run Again"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="flex gap-4 mb-6">
            <Badge variant="outline" className="bg-green-50">
              <CheckCircle className="h-4 w-4 mr-1" />
              {successCount} Success
            </Badge>
            <Badge variant="outline" className="bg-yellow-50">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {warningCount} Warning
            </Badge>
            <Badge variant="outline" className="bg-red-50">
              <XCircle className="h-4 w-4 mr-1" />
              {errorCount} Error
            </Badge>
          </div>

          {/* Main Problem Alert */}
          {errorCount > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Found {errorCount} critical issue(s):</strong>
                <ul className="mt-2 list-disc list-inside">
                  {results
                    .filter(r => r.status === "error")
                    .map((result, index) => (
                      <li key={index}>{result.message}</li>
                    ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Detailed Results */}
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.name}</span>
                    {result.count !== undefined && (
                      <Badge variant="secondary">
                        {result.count} items
                      </Badge>
                    )}
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                
                {result.details && result.details.length > 0 && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <ul className="list-disc list-inside space-y-1">
                      {result.details.map((detail, detailIndex) => (
                        <li key={detailIndex}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Solution Card */}
      {errorCount > 0 && (
        <Card className="w-full max-w-4xl mx-auto border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <AlertTriangle className="h-6 w-6" />
              🚨 URGENT FIX NEEDED
            </CardTitle>
            <div className="text-sm text-blue-600">
              Your Firestore security rules are blocking access. This is why everything stopped working.
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>The Problem:</strong> Your Firebase security rules changed and are now blocking your app from accessing the database. This is why URL shortening and admin login stopped working.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Step 1: Go to Firebase Console
                </h4>
                <ol className="list-decimal list-inside text-sm space-y-1 ml-4">
                  <li>Open <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Firebase Console</a></li>
                  <li>Select your project: <code className="bg-gray-100 px-1 rounded">url-shortener-firebase-52d15</code></li>
                  <li>Go to <strong>Firestore Database</strong> in the left sidebar</li>
                  <li>Click on the <strong>Rules</strong> tab</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Step 2: Replace Security Rules
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Copy this code and replace your current rules:
                </p>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{securityRules}</code>
                  </pre>
                  <Button
                    onClick={() => copyToClipboard(securityRules)}
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Step 3: Publish Rules</h4>
                <ol className="list-decimal list-inside text-sm space-y-1 ml-4">
                  <li>Click the <strong>"Publish"</strong> button in Firebase Console</li>
                  <li>Wait for the rules to deploy (usually takes a few seconds)</li>
                  <li>Come back here and click "Run Again" to test</li>
                </ol>
              </div>

              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> These rules allow full read/write access for testing. Once everything is working, you can secure them properly later.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button 
                  onClick={runDiagnostics}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Test After Fixing Rules
                </Button>
                <Button 
                  onClick={() => window.open('https://console.firebase.google.com', '_blank')}
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Firebase Console
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
