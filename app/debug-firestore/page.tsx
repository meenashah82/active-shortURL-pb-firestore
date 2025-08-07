"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getFirebase } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { createShortUrl } from "@/lib/analytics-clean"
import { CheckCircle, XCircle, Database, Link, Users, BarChart3, TestTube } from 'lucide-react'

interface CollectionInfo {
  name: string
  count: number
  sampleData?: any[]
}

export default function DebugFirestorePage() {
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking")
  const [collections, setCollections] = useState<CollectionInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isTestingUrl, setIsTestingUrl] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    checkFirebaseConnection()
  }, [])

  const checkFirebaseConnection = async () => {
    try {
      console.log("🔍 Checking Firebase connection...")
      const { db } = getFirebase()
      
      if (!db) {
        throw new Error("Database not initialized")
      }

      // Test connection by trying to read from a collection
      const testDoc = await getDoc(doc(db, "test", "connection"))
      console.log("✅ Firebase connection successful")
      
      setConnectionStatus("connected")
      await loadCollections()
    } catch (err) {
      console.error("❌ Firebase connection failed:", err)
      setConnectionStatus("error")
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const loadCollections = async () => {
    try {
      const { db } = getFirebase()
      if (!db) return

      const collectionsToCheck = ["admins", "urls", "analytics", "clicks"]
      const collectionInfo: CollectionInfo[] = []

      for (const collectionName of collectionsToCheck) {
        try {
          const snapshot = await getDocs(collection(db, collectionName))
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          
          collectionInfo.push({
            name: collectionName,
            count: snapshot.size,
            sampleData: docs.slice(0, 3) // First 3 documents
          })
          
          console.log(`📊 Collection ${collectionName}: ${snapshot.size} documents`)
        } catch (err) {
          console.error(`❌ Error loading ${collectionName}:`, err)
          collectionInfo.push({
            name: collectionName,
            count: 0,
            sampleData: []
          })
        }
      }

      setCollections(collectionInfo)
    } catch (err) {
      console.error("❌ Error loading collections:", err)
      setError(err instanceof Error ? err.message : "Failed to load collections")
    }
  }

  const testUrlCreation = async () => {
    setIsTestingUrl(true)
    setTestResult(null)

    try {
      const testUrl = "https://example.com"
      const testShortCode = `test_${Date.now()}`
      
      console.log(`🧪 Testing URL creation: ${testShortCode} -> ${testUrl}`)
      
      await createShortUrl(testShortCode, testUrl)
      
      setTestResult(`✅ Successfully created test URL: ${testShortCode}`)
      
      // Reload collections to show the new data
      await loadCollections()
    } catch (err) {
      console.error("❌ URL creation test failed:", err)
      setTestResult(`❌ Failed to create test URL: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsTestingUrl(false)
    }
  }

  const getCollectionIcon = (name: string) => {
    switch (name) {
      case "admins": return <Users className="h-4 w-4" />
      case "urls": return <Link className="h-4 w-4" />
      case "analytics": return <BarChart3 className="h-4 w-4" />
      case "clicks": return <Database className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Firestore Debug Dashboard</h1>
          <p className="text-gray-600">Monitor your Firebase connection and database status</p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {connectionStatus === "checking" && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Checking connection...</span>
                </>
              )}
              {connectionStatus === "connected" && (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">Connected to Firebase</span>
                  <Badge variant="secondary">Project: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</Badge>
                </>
              )}
              {connectionStatus === "error" && (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-600 font-medium">Connection Failed</span>
                </>
              )}
            </div>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Firebase configuration status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'NEXT_PUBLIC_FIREBASE_API_KEY',
                'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
                'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
                'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
                'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
                'NEXT_PUBLIC_FIREBASE_APP_ID'
              ].map((envVar) => {
                const value = process.env[envVar]
                return (
                  <div key={envVar} className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm font-mono">{envVar}</span>
                    {value ? (
                      <Badge variant="secondary" className="text-green-600">✓ Set</Badge>
                    ) : (
                      <Badge variant="destructive">✗ Missing</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Collections */}
        {connectionStatus === "connected" && (
          <Card>
            <CardHeader>
              <CardTitle>Database Collections</CardTitle>
              <CardDescription>Overview of your Firestore collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collections.map((collection) => (
                  <div key={collection.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCollectionIcon(collection.name)}
                        <h3 className="font-semibold capitalize">{collection.name}</h3>
                      </div>
                      <Badge variant={collection.count > 0 ? "default" : "secondary"}>
                        {collection.count} documents
                      </Badge>
                    </div>
                    
                    {collection.sampleData && collection.sampleData.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Sample documents:</p>
                        <div className="space-y-2">
                          {collection.sampleData.map((doc, index) => (
                            <div key={index} className="bg-gray-50 p-2 rounded text-xs font-mono">
                              <strong>ID:</strong> {doc.id}
                              {collection.name === "admins" && (
                                <div>Username: {doc.username}, Role: {doc.role}, Active: {doc.isActive ? "Yes" : "No"}</div>
                              )}
                              {collection.name === "urls" && (
                                <div>URL: {doc.originalUrl}, Clicks: {doc.totalClicks || 0}</div>
                              )}
                              {collection.name === "analytics" && (
                                <div>Clicks: {doc.totalClicks || 0}, Events: {doc.clickEvents?.length || 0}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test URL Creation */}
        {connectionStatus === "connected" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test URL Creation
              </CardTitle>
              <CardDescription>Test if URL shortening is working properly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testUrlCreation} 
                disabled={isTestingUrl}
                className="w-full"
              >
                {isTestingUrl ? "Creating Test URL..." : "Create Test URL"}
              </Button>
              
              {testResult && (
                <Alert variant={testResult.includes("✅") ? "default" : "destructive"}>
                  <AlertDescription>{testResult}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={checkFirebaseConnection} variant="outline">
                Refresh Connection
              </Button>
              <Button onClick={loadCollections} variant="outline" disabled={connectionStatus !== "connected"}>
                Reload Collections
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
