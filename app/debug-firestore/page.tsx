"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where } from "firebase/firestore"

export default function DebugFirestore() {
  const [urlsData, setUrlsData] = useState<any[]>([])
  const [analyticsData, setAnalyticsData] = useState<any[]>([])
  const [specificDoc, setSpecificDoc] = useState<any>(null)
  const [shortCode, setShortCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [error, setError] = useState<string>("")

  // Test database connection
  const testConnection = async () => {
    try {
      console.log("🔍 Testing database connection...")
      setConnectionStatus('checking')
      setError("")
      
      // Try to read a simple document
      const testRef = doc(db, 'test', 'connection')
      await getDoc(testRef)
      
      console.log("✅ Database connection successful")
      setConnectionStatus('connected')
    } catch (err) {
      console.error("❌ Database connection failed:", err)
      setConnectionStatus('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  // Load all URLs - SAFE READ ONLY
  const loadAllUrls = async () => {
    setLoading(true)
    try {
      console.log("📄 Loading URLs collection...")
      const urlsRef = collection(db, "urls")
      const urlsQuery = query(urlsRef, orderBy("createdAt", "desc"), limit(20))
      const snapshot = await getDocs(urlsQuery)

      const urls = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || "Unknown",
      }))

      setUrlsData(urls)
      console.log("📄 URLs loaded:", urls.length, "documents")
    } catch (error) {
      console.error("❌ Error loading URLs:", error)
      setUrlsData([])
    } finally {
      setLoading(false)
    }
  }

  // Load all analytics - SAFE READ ONLY
  const loadAllAnalytics = async () => {
    setLoading(true)
    try {
      console.log("📊 Loading analytics collection...")
      const analyticsRef = collection(db, "analytics")
      const analyticsQuery = query(analyticsRef, orderBy("createdAt", "desc"), limit(20))
      const snapshot = await getDocs(analyticsQuery)

      const analytics = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || "Unknown",
        clickEventsCount: doc.data().clickEvents?.length || 0,
      }))

      setAnalyticsData(analytics)
      console.log("📊 Analytics loaded:", analytics.length, "documents")
    } catch (error) {
      console.error("❌ Error loading analytics:", error)
      setAnalyticsData([])
    } finally {
      setLoading(false)
    }
  }

  // Load specific document - SAFE READ ONLY
  const loadSpecificDoc = async () => {
    if (!shortCode) return

    setLoading(true)
    try {
      console.log(`🔍 Loading specific document for: ${shortCode}`)
      const urlRef = doc(db, "urls", shortCode)
      const analyticsRef = doc(db, "analytics", shortCode)

      const [urlSnap, analyticsSnap] = await Promise.all([getDoc(urlRef), getDoc(analyticsRef)])

      const result = {
        shortCode,
        urlExists: urlSnap.exists(),
        analyticsExists: analyticsSnap.exists(),
        urlData: urlSnap.exists()
          ? {
              ...urlSnap.data(),
              createdAt: urlSnap.data()?.createdAt?.toDate?.()?.toISOString(),
            }
          : null,
        analyticsData: analyticsSnap.exists()
          ? {
              ...analyticsSnap.data(),
              createdAt: analyticsSnap.data()?.createdAt?.toDate?.()?.toISOString(),
              clickEventsCount: analyticsSnap.data()?.clickEvents?.length || 0,
            }
          : null,
      }

      setSpecificDoc(result)
      console.log("🔍 Specific document loaded:", result)
    } catch (error) {
      console.error("❌ Error loading specific document:", error)
    } finally {
      setLoading(false)
    }
  }

  // Test URL creation
  const testUrlCreation = async () => {
    try {
      console.log("🧪 Testing URL creation...")
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com/test' }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ URL creation test successful:", data)
        alert(`Success! Created: ${data.shortCode}`)
        // Refresh data
        loadAllUrls()
        loadAllAnalytics()
      } else {
        const errorText = await response.text()
        console.error("❌ URL creation test failed:", errorText)
        alert(`Failed: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("❌ URL creation test error:", error)
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  useEffect(() => {
    testConnection()
    loadAllUrls()
    loadAllAnalytics()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🔍 Database Status & Recovery</h1>
        <p className="text-gray-600">Safe database inspection and recovery tools</p>
      </div>

      {/* Connection Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🔌 Database Connection
            <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}>
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Error' : 'Checking...'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button onClick={testConnection} variant="outline">
              Test Connection
            </Button>
            <Button onClick={testUrlCreation} variant="outline">
              Test URL Creation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Specific Document Lookup */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>🎯 Inspect Specific Short Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter short code (e.g., abc123)"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
            />
            <Button onClick={loadSpecificDoc} disabled={loading || !shortCode}>
              Inspect
            </Button>
          </div>

          {specificDoc && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-auto">{JSON.stringify(specificDoc, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* URLs Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              📄 URLs Collection ({urlsData.length})
              <Button size="sm" onClick={loadAllUrls} disabled={loading}>
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urlsData.length === 0 ? (
              <p className="text-gray-500">No URLs found</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {urlsData.map((url, index) => (
                  <div key={url.id} className="p-3 bg-gray-50 rounded border">
                    <div className="font-mono text-sm text-blue-600 mb-1">/{url.shortCode || url.id}</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <strong>URL:</strong> {url.originalUrl || "N/A"}
                      </div>
                      <div>
                        <strong>Active:</strong> {url.isActive ? "✅" : "❌"}
                      </div>
                      <div>
                        <strong>Created:</strong> {url.createdAt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              📊 Analytics Collection ({analyticsData.length})
              <Button size="sm" onClick={loadAllAnalytics} disabled={loading}>
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.length === 0 ? (
              <p className="text-gray-500">No analytics found</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analyticsData.map((analytics, index) => (
                  <div key={analytics.id} className="p-3 bg-gray-50 rounded border">
                    <div className="font-mono text-sm text-green-600 mb-1">/{analytics.shortCode || analytics.id}</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <strong>Total Clicks:</strong> {analytics.totalClicks || 0}
                      </div>
                      <div>
                        <strong>Click Events:</strong> {analytics.clickEventsCount}
                      </div>
                      <div>
                        <strong>Created:</strong> {analytics.createdAt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Export */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📋 Data Export & Recovery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => {
                const data = { urls: urlsData, analytics: analyticsData }
                navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                alert("Data copied to clipboard!")
              }}
              variant="outline"
            >
              Copy All Data
            </Button>
            <Button
              onClick={() => {
                const data = { 
                  timestamp: new Date().toISOString(),
                  urls: urlsData, 
                  analytics: analyticsData 
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `firestore-backup-${new Date().toISOString().split('T')[0]}.json`
                a.click()
              }}
              variant="outline"
            >
              Download Backup
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            <p><strong>Database Status:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• <code>urls/</code> - {urlsData.length} documents</li>
              <li>• <code>analytics/</code> - {analyticsData.length} documents</li>
              <li>• Connection: {connectionStatus}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
