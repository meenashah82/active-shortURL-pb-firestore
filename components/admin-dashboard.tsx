"use client"

import { useState, useEffect } from "react"
import { getFirebase } from "@/lib/firebase"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, ExternalLink, BarChart3 } from "lucide-react"

interface UrlData {
  id: string
  originalUrl: string
  shortCode: string
  createdAt: Date
  totalClicks: number
}

interface AdminDashboardProps {
  onLogout: () => void
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [urls, setUrls] = useState<UrlData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUrls = async () => {
    try {
      setLoading(true)
      setError(null)

      const { db } = getFirebase()
      if (!db) {
        setError("Firebase Firestore is not available. Please enable it in your Firebase project console.")
        return
      }

      const urlsCollection = collection(db, "urls")
      const snapshot = await getDocs(urlsCollection)

      const urlsData: UrlData[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          originalUrl: data.originalUrl || "",
          shortCode: data.shortCode || "",
          createdAt: data.createdAt?.toDate() || new Date(),
          totalClicks: data.totalClicks || 0,
        }
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
        <div className="flex gap-2">
          <Button onClick={fetchUrls} variant="outline">
            Refresh
          </Button>
          <Button onClick={onLogout} variant="destructive">
            Logout
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urls.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urls.reduce((sum, url) => sum + url.totalClicks, 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Clicks</CardTitle>
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
              <p className="text-muted-foreground">No URLs found. Create some short URLs to see them here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {urls.map((url) => (
                <div key={url.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono">
                        {url.shortCode}
                      </Badge>
                      <Badge variant="secondary">{url.totalClicks} clicks</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{url.originalUrl}</p>
                    <p className="text-xs text-muted-foreground">
                      Created: {url.createdAt.toLocaleDateString()} at {url.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://www.wodify.link/${url.shortCode}`, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/analytics/${url.shortCode}`, "_blank")}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteUrl(url.id, url.shortCode)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
