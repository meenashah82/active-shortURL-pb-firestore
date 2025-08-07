'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getFirebase } from '@/lib/firebase'
import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore'

interface CollectionInfo {
  name: string
  exists: boolean
  documentCount: number
  sampleDocuments: any[]
  error?: string
}

export default function DebugFirestore() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [connectionError, setConnectionError] = useState<string>('')
  const [collections, setCollections] = useState<CollectionInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    console.log('🔍 Starting Firebase connection check...')
    
    try {
      const { app, db } = getFirebase()
      
      if (!app || !db) {
        throw new Error('Firebase initialization failed')
      }

      console.log('✅ Firebase connection successful')
      console.log('📊 App name:', app.name)
      console.log('📊 Project ID:', app.options.projectId)
      
      setConnectionStatus('connected')
      setConnectionError('')
      
      // Check collections after successful connection
      await checkCollections()
      
    } catch (error: any) {
      console.error('❌ Firebase connection failed:', error)
      setConnectionStatus('error')
      setConnectionError(error.message || 'Unknown error')
    }
  }

  const checkCollections = async () => {
    console.log('🔍 Checking collections...')
    setIsLoading(true)
    
    const collectionsToCheck = ['urls', 'analytics', 'clicks']
    const collectionResults: CollectionInfo[] = []
    
    const { db } = getFirebase()
    if (!db) {
      console.error('❌ Database not available')
      setIsLoading(false)
      return
    }

    for (const collectionName of collectionsToCheck) {
      try {
        console.log(`🔍 Checking collection: ${collectionName}`)
        
        const collectionRef = collection(db, collectionName)
        const snapshot = await getDocs(query(collectionRef, limit(5)))
        
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }))
        
        const collectionInfo: CollectionInfo = {
          name: collectionName,
          exists: !snapshot.empty,
          documentCount: snapshot.size,
          sampleDocuments: documents
        }
        
        console.log(`✅ Collection ${collectionName}:`, {
          exists: collectionInfo.exists,
          documentCount: collectionInfo.documentCount,
          sampleDocs: documents.length
        })
        
        collectionResults.push(collectionInfo)
        
      } catch (error: any) {
        console.error(`❌ Error checking collection ${collectionName}:`, error)
        
        collectionResults.push({
          name: collectionName,
          exists: false,
          documentCount: 0,
          sampleDocuments: [],
          error: error.message
        })
      }
    }
    
    setCollections(collectionResults)
    setIsLoading(false)
    console.log('✅ Collection check complete')
  }

  const testDocumentRead = async () => {
    console.log('🔍 Testing document read...')
    
    const { db } = getFirebase()
    if (!db) {
      console.error('❌ Database not available')
      return
    }

    try {
      // Try to read a specific document
      const testDocRef = doc(db, 'urls', 'test')
      const testDoc = await getDoc(testDocRef)
      
      console.log('📄 Test document read result:', {
        exists: testDoc.exists(),
        data: testDoc.exists() ? testDoc.data() : null
      })
      
    } catch (error: any) {
      console.error('❌ Document read test failed:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Firestore Debug Dashboard</h1>
        <p className="text-muted-foreground">
          Debug Firebase connection and database collections
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Database Connection Status
            {connectionStatus === 'checking' && (
              <Badge variant="secondary">Checking...</Badge>
            )}
            {connectionStatus === 'connected' && (
              <Badge variant="default" className="bg-green-500">Connected</Badge>
            )}
            {connectionStatus === 'error' && (
              <Badge variant="destructive">Error</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Firebase connection and initialization status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Connection Error:</h4>
              <p className="text-red-700 font-mono text-sm">{connectionError}</p>
            </div>
          )}
          
          {connectionStatus === 'connected' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">✅ Connected Successfully</h4>
              <p className="text-green-700">Firebase and Firestore are properly initialized</p>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button onClick={checkConnection} variant="outline">
              Recheck Connection
            </Button>
            <Button onClick={testDocumentRead} variant="outline">
              Test Document Read
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Collections Status */}
      <Card>
        <CardHeader>
          <CardTitle>Collections Status</CardTitle>
          <CardDescription>
            Status of main database collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <p>Checking collections...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {collections.map((collection) => (
                <div key={collection.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{collection.name}</h4>
                    <div className="flex gap-2">
                      <Badge variant={collection.exists ? "default" : "secondary"}>
                        {collection.exists ? "Exists" : "Empty/Missing"}
                      </Badge>
                      <Badge variant="outline">
                        {collection.documentCount} docs
                      </Badge>
                    </div>
                  </div>
                  
                  {collection.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                      <p className="text-red-700 text-sm font-mono">{collection.error}</p>
                    </div>
                  )}
                  
                  {collection.sampleDocuments.length > 0 && (
                    <div className="mt-2">
                      <h5 className="text-sm font-medium mb-1">Sample Documents:</h5>
                      <div className="bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
                        <pre className="text-xs">
                          {JSON.stringify(collection.sampleDocuments, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <Separator className="my-4" />
          
          <Button onClick={checkCollections} disabled={isLoading} className="w-full">
            {isLoading ? 'Checking...' : 'Refresh Collections'}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">1. Check the connection status above</p>
          <p className="text-sm">2. Verify that collections exist and have documents</p>
          <p className="text-sm">3. Open browser console for detailed logs</p>
          <p className="text-sm">4. If collections are missing, you may need to create some URLs first</p>
        </CardContent>
      </Card>
    </div>
  )
}
