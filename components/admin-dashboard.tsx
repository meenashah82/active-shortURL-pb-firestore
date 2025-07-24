"use client"

import { useState, useEffect } from "react"
import { getFirebase } from "@/lib/firebase"
import { collection, getDocs, deleteDoc, doc, onSnapshot } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, ExternalLink, BarChart3 } from "lucide-react"

interface UrlData {
  id: string
  originalUrl: string
  shortCode: string
  createdAt: Date
  totalClicks: number
}

export function AdminDashboard() {
  const [urls, setUrls] = useState<UrlData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUrls = async () => {
    try {
      setLoading(true)
      setError(null)

      const { db } = getFirebase()
      if (!db) {
        setError("Firebase Firestore is not available. Please check your configuration.")
        return
      }

      const urlsCollection = collection(db, "urls")
      const snapshot = await getDocs(urlsCollection)

      const urlsData: UrlData[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        urlsData.push({
          id: doc.id,
          originalUrl: data.originalUrl || "",
          shortCode: data.shortCode || "",
          createdAt: data.createdAt?.toDate() || new Date(),
          totalClicks: 0, // Initialize with 0, will be updated by real-time listener
        })
      })

      // Sort by creation date (newest first)
      urlsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setUrls(urlsData)
    } catch (error: any) {
      console.error("Error fetching URLs:", error)
      setError(`Failed to fetch URLs: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteUrl = async (id: string, shortCode: string) => {
    if (!confirm(`Are you sure you want to delete the short URL "${shortCode}"?`)) {
      return
    }

    try {
      const { db } = getFirebase()
      if (!db) {
        setError("Database connection not available")
        return
      }

      await deleteDoc(doc(db, "urls", id))
      setUrls(urls.filter((url) => url.id !== id))
    } catch (error: any) {
      console.error("Error deleting URL:", error)
      setError(`Failed to delete URL: ${error.message}`)
    }
  }

  // Set up real-time listeners for analytics updates
  useEffect(() => {
    const { db } = getFirebase()
    if (!db || urls.length === 0) return

    const unsubscribers: (() => void)[] = []

    // Set up real-time listener for each URL's analytics
    urls.forEach((url) => {
      const analyticsRef = doc(db, "analytics", url.shortCode)

      const unsubscribe = onSnapshot(
        analyticsRef,
        { includeMetadataChanges: true },
        (doc) => {
          if (doc.exists()) {
            const analyticsData = doc.data()
            const totalClicks = analyticsData.totalClicks || 0

            // Update the specific URL's click count in state
            setUrls((prevUrls) =>
              prevUrls.map((prevUrl) => (prevUrl.shortCode === url.shortCode ? { ...prevUrl, totalClicks } : prevUrl)),
            )
          }
        },
        (error) => {
          console.error(`Error listening to analytics for ${url.shortCode}:`, error)
        },
      )

      unsubscribers.push(unsubscribe)
    })

    // Cleanup function
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [urls.length]) // Re-run when URLs are loaded

  useEffect(() => {
    fetchUrls()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>Loading URL data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage shortened URLs and view analytics</p>
        </div>
        <Button onClick={fetchUrls} variant="outline">
          Refresh
        </Button>
      </div>

      {error && (
        <Alert>
          <AlertDescription>
            {error}
            {error.includes("Firestore is not available") && (
              <div className="mt-2">
                <p className="font-semibold">To fix this:</p>
                <ol className="list-decimal list-inside text-sm mt-1">
                  <li>Go to Firebase Console → Build → Firestore Database</li>
                  <li>Create database if it doesn't exist</li>
                  <li>Set security rules to allow access</li>
                </ol>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urls.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urls.reduce((sum, url) => sum + url.totalClicks, 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Clicks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {urls.length > 0 ? Math.round(urls.reduce((sum, url) => sum + url.totalClicks, 0) / urls.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* URLs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Shortened URLs</CardTitle>
          <CardDescription>Manage and monitor your shortened URLs</CardDescription>
        </CardHeader>
        <CardContent>
          {urls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No URLs found. Create your first shortened URL!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Short Code</TableHead>
                    <TableHead>Original URL</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {urls.map((url) => (
                    <TableRow key={url.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{url.shortCode}</Badge>
                          <a
                            href={`https://www.wodify.link/${url.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={url.originalUrl}>
                          {url.originalUrl}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{url.totalClicks}</Badge>
                      </TableCell>
                      <TableCell>{url.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/analytics/${url.shortCode}`, "_blank")}
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteUrl(url.id, url.shortCode)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
