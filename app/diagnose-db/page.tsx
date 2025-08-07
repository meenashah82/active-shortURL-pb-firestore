'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, XCircle, AlertTriangle, Database, Users, Link, BarChart3, RefreshCw } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, getDoc, query, limit } from 'firebase/firestore'

interface DiagnosticResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: any
  count?: number
}

export default function DiagnoseDbPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [collections, setCollections] = useState<any>({})

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result])
  }

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults([])
    setCollections({})

    try {
      // Test 1: Firebase Connection
      addResult({
        name: 'Firebase Connection',
        status: 'info',
        message: 'Testing Firebase connection...'
      })

      if (!db) {
        addResult({
          name: 'Firebase Connection',
          status: 'error',
          message: 'Firebase database not initialized'
        })
        return
      }

      addResult({
        name: 'Firebase Connection',
        status: 'success',
        message: 'Firebase connection established'
      })

      // Test 2: Check admins collection
      addResult({
        name: 'Admins Collection',
        status: 'info',
        message: 'Checking admins collection...'
      })

      try {
        const adminsSnapshot = await getDocs(query(collection(db, 'admins'), limit(10)))
        const adminDocs = adminsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setCollections(prev => ({ ...prev, admins: adminDocs }))

        addResult({
          name: 'Admins Collection',
          status: 'success',
          message: `Found ${adminDocs.length} admin users`,
          count: adminDocs.length,
          details: adminDocs.map(admin => ({
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive
          }))
        })
      } catch (error) {
        addResult({
          name: 'Admins Collection',
          status: 'error',
          message: `Error accessing admins collection: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }

      // Test 3: Check urls collection
      addResult({
        name: 'URLs Collection',
        status: 'info',
        message: 'Checking urls collection...'
      })

      try {
        const urlsSnapshot = await getDocs(query(collection(db, 'urls'), limit(10)))
        const urlDocs = urlsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setCollections(prev => ({ ...prev, urls: urlDocs }))

        if (urlDocs.length === 0) {
          addResult({
            name: 'URLs Collection',
            status: 'warning',
            message: 'URLs collection exists but is empty',
            count: 0
          })
        } else {
          addResult({
            name: 'URLs Collection',
            status: 'success',
            message: `Found ${urlDocs.length} URLs`,
            count: urlDocs.length,
            details: urlDocs.map(url => ({
              shortCode: url.shortCode,
              originalUrl: url.originalUrl,
              totalClicks: url.totalClicks || 0,
              isActive: url.isActive,
              createdAt: url.createdAt
            }))
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        if (errorMessage.includes('Missing or insufficient permissions')) {
          addResult({
            name: 'URLs Collection',
            status: 'error',
            message: 'Permission denied - Firestore security rules are blocking access',
            details: { error: errorMessage, solution: 'Update Firestore security rules' }
          })
        } else {
          addResult({
            name: 'URLs Collection',
            status: 'error',
            message: `URLs collection missing or inaccessible: ${errorMessage}`
          })
        }
      }

      // Test 4: Check analytics collection (legacy)
      addResult({
        name: 'Analytics Collection',
        status: 'info',
        message: 'Checking analytics collection...'
      })

      try {
        const analyticsSnapshot = await getDocs(query(collection(db, 'analytics'), limit(10)))
        const analyticsDocs = analyticsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setCollections(prev => ({ ...prev, analytics: analyticsDocs }))

        addResult({
          name: 'Analytics Collection',
          status: analyticsDocs.length > 0 ? 'success' : 'warning',
          message: analyticsDocs.length > 0 
            ? `Found ${analyticsDocs.length} analytics records` 
            : 'Analytics collection exists but is empty',
          count: analyticsDocs.length,
          details: analyticsDocs.slice(0, 5)
        })
      } catch (error) {
        addResult({
          name: 'Analytics Collection',
          status: 'warning',
          message: 'Analytics collection not found (this might be normal if using subcollections)'
        })
      }

      // Test 5: Test a specific URL document
      addResult({
        name: 'Sample URL Test',
        status: 'info',
        message: 'Testing access to a sample URL...'
      })

      try {
        const sampleDoc = await getDoc(doc(db, 'urls', 'sample1'))
        if (sampleDoc.exists()) {
          addResult({
            name: 'Sample URL Test',
            status: 'success',
            message: 'Successfully accessed sample URL document',
            details: sampleDoc.data()
          })
        } else {
          addResult({
            name: 'Sample URL Test',
            status: 'warning',
            message: 'Sample URL document not found (this is normal if no sample data exists)'
          })
        }
      } catch (error) {
        addResult({
          name: 'Sample URL Test',
          status: 'error',
          message: `Cannot access URL documents: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }

    } catch (error) {
      addResult({
        name: 'General Error',
        status: 'error',
        message: `Unexpected error during diagnostics: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Diagnostics</h1>
        <p className="text-muted-foreground">
          Safe diagnostic tool to check your Firestore database status without making any changes.
        </p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full sm:w-auto"
        >
          {isRunning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Run Database Diagnostics
            </>
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <Tabs defaultValue="results" className="space-y-6">
          <TabsList>
            <TabsTrigger value="results">Diagnostic Results</TabsTrigger>
            <TabsTrigger value="collections">Collection Data</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Diagnostic Results</CardTitle>
                <CardDescription>
                  Results of database connectivity and structure checks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                          <Badge className={getStatusColor(result.status)}>
                            {result.status}
                          </Badge>
                          {result.count !== undefined && (
                            <Badge variant="outline">
                              {result.count} items
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                      {result.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            Show details
                          </summary>
                          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collections">
            <div className="grid gap-6">
              {Object.entries(collections).map(([collectionName, data]) => (
                <Card key={collectionName}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {collectionName === 'admins' && <Users className="h-5 w-5" />}
                      {collectionName === 'urls' && <Link className="h-5 w-5" />}
                      {collectionName === 'analytics' && <BarChart3 className="h-5 w-5" />}
                      {collectionName} Collection
                    </CardTitle>
                    <CardDescription>
                      {Array.isArray(data) ? `${data.length} documents found` : 'No data'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(data) && data.length > 0 ? (
                      <div className="space-y-2">
                        {data.slice(0, 5).map((item: any, index: number) => (
                          <div key={index} className="border rounded p-2 text-sm">
                            <div className="font-mono text-xs">
                              ID: {item.id}
                            </div>
                            <div className="mt-1">
                              {Object.entries(item)
                                .filter(([key]) => key !== 'id' && key !== 'password')
                                .slice(0, 4)
                                .map(([key, value]) => (
                                  <div key={key} className="text-xs text-muted-foreground">
                                    {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                        {data.length > 5 && (
                          <div className="text-xs text-muted-foreground">
                            ... and {data.length - 5} more documents
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No documents found</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Common Issues */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-red-600">❌ "Missing or insufficient permissions"</h4>
              <p className="text-muted-foreground">
                Your Firestore security rules are blocking access. You need to temporarily allow read/write access.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-600">⚠️ "URLs collection missing"</h4>
              <p className="text-muted-foreground">
                The URLs collection was deleted. This is why URL shortening isn't working.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-green-600">✅ "Admins found but can't login"</h4>
              <p className="text-muted-foreground">
                Admin data exists but security rules prevent authentication. Fix the rules first.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
