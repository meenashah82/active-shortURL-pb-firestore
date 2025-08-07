"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Database, Users, Link } from 'lucide-react'
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

  const errorCount = results.filter(r => r.status === "error").length
  const warningCount = results.filter(r => r.status === "warning").length
  const successCount = results.filter(r => r.status === "success").length

  return (
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

        {/* Solutions */}
        {errorCount > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommended Solutions:</strong>
              <ol className="mt-2 list-decimal list-inside space-y-1">
                <li>Update Firestore Security Rules to allow read/write access</li>
                <li>If URLs collection is missing, it needs to be recreated</li>
                <li>Check that all environment variables are correctly set</li>
                <li>Verify Firebase project configuration</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
