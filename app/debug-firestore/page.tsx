"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { getFirebase } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface CollectionInfo {
  name: string
  count: number
  sampleDocs: any[]
}

export default function DebugFirestorePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [collections, setCollections] = useState<CollectionInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  const checkConnection = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log("🔍 Testing Firestore connection...")
      const { db } = getFirebase()
      
      if (!db) {
        throw new Error("Failed to initialize Firestore")
      }

      // Test connection by trying to read a document
      const testDoc = await getDoc(doc(db, "test", "connection"))
      console.log("✅ Firestore connection successful")
      
      setConnectionStatus('connected')
      
      // Get collection information
      await loadCollections()
      
    } catch (error) {
      console.error("❌ Firestore connection failed:", error)
      setConnectionStatus('error')
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsLoading(false)
    }
  }

  const loadCollections = async () => {
    try {
      const { db } = getFirebase()
      const collectionsToCheck = ['urls', 'admins', 'analytics']
      const collectionInfo: CollectionInfo[] = []

      for (const collectionName of collectionsToCheck) {
        try {
          const snapshot = await getDocs(collection(db, collectionName))
          const docs: any[] = []
          
          snapshot.forEach((doc, index) => {
            if (index < 3) { // Only get first 3 docs as samples
              docs.push({
                id: doc.id,
                data: doc.data()
              })
            }
          })

          collectionInfo.push({
            name: collectionName,
            count: snapshot.size,
            sampleDocs: docs
          })
        } catch (error) {
          console.error(`Error loading collection ${collectionName}:`, error)
          collectionInfo.push({
            name: collectionName,
            count: 0,
            sampleDocs: []
          })
        }
      }

      setCollections(collectionInfo)
    } catch (error) {
      console.error("Error loading collections:", error)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Firestore Database Debug</h1>
          <p className="text-gray-600">Check your database connection and inspect collections</p>
        </div>

        {/* Connection Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-700">Connected to Firestore</span>
                  </>
                )}
                {connectionStatus === 'error' && (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">Connection Failed</span>
                  </>
                )}
                {connectionStatus === 'unknown' && (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <span className="text-yellow-700">Checking Connection...</span>
                  </>
                )}
              </div>
              <Button 
                onClick={checkConnection} 
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Collections Info */}
        {collections.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Collections Overview</h2>
            
            {collections.map((collection) => (
              <Card key={collection.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{collection.name}</CardTitle>
                    <Badge variant={collection.count > 0 ? "default" : "secondary"}>
                      {collection.count} documents
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {collection.count > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Sample documents (showing first 3):
                      </p>
                      {collection.sampleDocs.map((doc, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                          <div className="text-sm font-medium text-gray-900 mb-2">
                            Document ID: {doc.id}
                          </div>
                          <pre className="text-xs text-gray-600 overflow-x-auto">
                            {JSON.stringify(doc.data, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No documents found in this collection</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Environment Variables Check */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Check if Firebase configuration is properly set</CardDescription>
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
                  <div key={envVar} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{envVar}</span>
                    {value ? (
                      <Badge variant="default">Set</Badge>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
