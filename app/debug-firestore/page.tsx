"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle, Database, Users, Link, BarChart3 } from 'lucide-react'
import { getFirebase } from "@/lib/firebase"
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore"
import { createShortUrl, getUrlData, recordClick } from "@/lib/analytics-clean"
import { getAllAdminUsers, createAdminUser } from "@/lib/admin-auth"

interface TestResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

export default function DebugFirestorePage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }

  const runTests = async () => {
    setIsRunning(true)
    setResults([])

    // Test 1: Firebase Connection
    try {
      const { app, db } = getFirebase()
      if (app && db) {
        addResult({
          name: "Firebase Connection",
          status: "success",
          message: "Firebase initialized successfully",
          details: { projectId: app.options.projectId }
        })
      } else {
        addResult({
          name: "Firebase Connection",
          status: "error",
          message: "Failed to initialize Firebase"
        })
      }
    } catch (error) {
      addResult({
        name: "Firebase Connection",
        status: "error",
        message: `Firebase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }

    // Test 2: Check Collections
    try {
      const { db } = getFirebase()
      if (db) {
        const collections = ['admins', 'urls', 'analytics']
        for (const collectionName of collections) {
          try {
            const snapshot = await getDocs(collection(db, collectionName))
            addResult({
              name: `${collectionName} Collection`,
              status: "success",
              message: `Found ${snapshot.size} documents`,
              details: { count: snapshot.size }
            })
          } catch (error) {
            addResult({
              name: `${collectionName} Collection`,
              status: "error",
              message: `Error accessing collection: ${error instanceof Error ? error.message : 'Unknown error'}`
            })
          }
        }
      }
    } catch (error) {
      addResult({
        name: "Collections Check",
        status: "error",
        message: `Collections check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }

    // Test 3: Admin Users
    try {
      const adminUsers = await getAllAdminUsers()
      addResult({
        name: "Admin Users",
        status: adminUsers.length > 0 ? "success" : "warning",
        message: `Found ${adminUsers.length} admin users`,
        details: adminUsers.map(u => ({ username: u.username, role: u.role, isActive: u.isActive }))
      })
    } catch (error) {
      addResult({
        name: "Admin Users",
        status: "error",
        message: `Failed to fetch admin users: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }

    // Test 4: Create Test URL
    try {
      const testShortCode = `test_${Date.now()}`
      const testUrl = "https://example.com"
      
      await createShortUrl(testShortCode, testUrl)
      addResult({
        name: "Create Test URL",
        status: "success",
        message: `Created test URL: ${testShortCode}`,
        details: { shortCode: testShortCode, originalUrl: testUrl }
      })

      // Test 5: Retrieve Test URL
      const retrievedUrl = await getUrlData(testShortCode)
      if (retrievedUrl) {
        addResult({
          name: "Retrieve Test URL",
          status: "success",
          message: "Successfully retrieved test URL",
          details: retrievedUrl
        })
      } else {
        addResult({
          name: "Retrieve Test URL",
          status: "error",
          message: "Failed to retrieve test URL"
        })
      }

      // Test 6: Record Test Click
      await recordClick(testShortCode, {
        userAgent: "Debug Test",
        referer: "Debug Page",
        ip: "127.0.0.1",
        clickSource: "test"
      })
      addResult({
        name: "Record Test Click",
        status: "success",
        message: "Successfully recorded test click"
      })

      // Clean up test data
      const { db } = getFirebase()
      if (db) {
        await deleteDoc(doc(db, "urls", testShortCode))
        await deleteDoc(doc(db, "analytics", testShortCode))
        addResult({
          name: "Cleanup Test Data",
          status: "success",
          message: "Test data cleaned up successfully"
        })
      }
    } catch (error) {
      addResult({
        name: "URL Operations",
        status: "error",
        message: `URL operations failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }

    setIsRunning(false)
  }

  const createTestAdmin = async () => {
    try {
      const result = await createAdminUser(
        "testadmin",
        "test@example.com",
        "testpassword123",
        "admin"
      )
      
      if (result.success) {
        addResult({
          name: "Create Test Admin",
          status: "success",
          message: "Test admin created successfully",
          details: result.user
        })
      } else {
        addResult({
          name: "Create Test Admin",
          status: "error",
          message: result.message
        })
      }
    } catch (error) {
      addResult({
        name: "Create Test Admin",
        status: "error",
        message: `Failed to create test admin: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-purple-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Firestore Debug Console</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Database Tests</span>
              </CardTitle>
              <CardDescription>
                Run comprehensive tests to diagnose Firebase and Firestore issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <Button 
                  onClick={runTests} 
                  disabled={isRunning}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isRunning ? "Running Tests..." : "Run All Tests"}
                </Button>
                <Button 
                  onClick={createTestAdmin} 
                  variant="outline"
                  disabled={isRunning}
                >
                  Create Test Admin
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  {results.filter(r => r.status === 'success').length} passed, {' '}
                  {results.filter(r => r.status === 'error').length} failed, {' '}
                  {results.filter(r => r.status === 'warning').length} warnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                          <Badge className={getStatusColor(result.status)}>
                            {result.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">{result.message}</p>
                      {result.details && (
                        <pre className="text-xs bg-gray-100 p-2 rounded ml-8 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                      {index < results.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Environment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Firebase Project ID:</strong>
                  <p className="text-gray-600">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}</p>
                </div>
                <div>
                  <strong>Firebase Auth Domain:</strong>
                  <p className="text-gray-600">{process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not set'}</p>
                </div>
                <div>
                  <strong>API Key:</strong>
                  <p className="text-gray-600">{process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Not set'}</p>
                </div>
                <div>
                  <strong>App ID:</strong>
                  <p className="text-gray-600">{process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'Set' : 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
