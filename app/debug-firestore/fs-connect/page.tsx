"use client"

import { useState, useEffect } from "react"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import { getFirebaseApp } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle2, Database } from "lucide-react"

export default function FirestoreConnectPage() {
  const [collections, setCollections] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  async function fetchCollections() {
    setLoading(true)
    setError(null)

    try {
      // Get Firebase app
      const app = getFirebaseApp()
      if (!app) {
        throw new Error("Firebase app not initialized")
      }

      // Get Firestore instance
      const db = getFirestore(app)

      // Fetch collections
      const collectionsSnapshot = await getDocs(collection(db, "/"))

      // Extract collection IDs
      const collectionIds = collectionsSnapshot.docs.map((doc) => doc.id)

      setCollections(collectionIds)
      setConnected(true)
    } catch (err) {
      console.error("Error fetching Firestore collections:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Firestore Connection Test
          </CardTitle>
          <CardDescription>
            This page tests the connection to Firestore and displays top-level collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Connection Status */}
            {connected ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Connected to Firestore</AlertTitle>
                <AlertDescription className="text-green-700">
                  Successfully connected to your Firestore database
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>Could not connect to Firestore. See error details below.</AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap font-mono text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Collections Display */}
            <div>
              <h3 className="text-lg font-medium mb-4">Top-Level Collections</h3>

              {loading ? (
                <p className="text-muted-foreground">Loading collections...</p>
              ) : collections.length > 0 ? (
                <ul className="space-y-2">
                  {collections.map((collectionId) => (
                    <li key={collectionId} className="p-3 bg-muted rounded-md font-mono text-sm">
                      {collectionId}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  {connected
                    ? "No collections found in your Firestore database."
                    : "Connect to Firestore to view collections."}
                </p>
              )}
            </div>

            <Button onClick={fetchCollections} disabled={loading} className="mt-4">
              {loading ? "Connecting..." : "Refresh Collections"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
