"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Eye, ExternalLink, AlertTriangle, RefreshCw } from "lucide-react"
import { collection, getDocs, deleteDoc, doc, orderBy, query, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface URLData {
  id: string
  originalUrl: string
  shortCode: string
  createdAt: string
  clicks: number
  isActive: boolean
}

export function AdminDashboard() {
  const [urls, setUrls] = useState<URLData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalUrls: 0,
    totalClicks: 0,
    activeUrls: 0,
  })

  const fetchUrls = async () => {
    try {
      if (!db) {
        throw new Error("Database not initialized")
      }

      const urlsQuery = query(collection(db, "urls"), orderBy("createdAt", "desc"), limit(100))
      const snapshot = await getDocs(urlsQuery)

      const urlsData: URLData[] = []
      let totalClicks = 0
      let activeUrls = 0

      snapshot.forEach((doc) => {
        const data = doc.data()
        const urlData: URLData = {
          id: doc.id,
          originalUrl: data.originalUrl || "",
          shortCode: data.shortCode || doc.id,
          createdAt: data.createdAt || "",
          clicks: data.clicks || 0,
          isActive: data.isActive !== false,
        }
        urlsData.push(urlData)
        totalClicks += urlData.clicks
        if (urlData.isActive) activeUrls++
      })

      setUrls(urlsData)
      setStats({
        totalUrls: urlsData.length,
        totalClicks,
        activeUrls,
      })
      setError(null)
    } catch (error) {
      console.error("Error fetching URLs:", error)
      setError(`Failed to fetch URLs: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteUrl = async (id: string) => {
    if (!confirm("Are you sure you want to delete this URL?")) return

    try {
      if (!db) {
        throw new Error("Database not initialized")
      }

      await deleteDoc(doc(db, "urls", id))
      await fetchUrls() // Refresh the list
    } catch (error) {
      console.error("Error deleting URL:", error)
      setError(`Failed to delete URL: ${error}`)
    }
  }

  useEffect(() => {
    fetchUrls()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUrls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUrls}</div>
          </CardContent>
        </Card>
      </div>

      {/* URLs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>URL Management</CardTitle>
              <CardDescription>Manage all shortened URLs in the system</CardDescription>
            </div>
            <Button onClick={fetchUrls} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {urls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No URLs found</div>
          ) : (
            <div className="space-y-4">
              {urls.map((url) => (
                <div key={url.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={url.isActive ? "default" : "secondary"}>
                        {url.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-sm text-gray-500">{url.clicks} clicks</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        Short URL: <span className="font-mono text-blue-600">/{url.shortCode}</span>
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        Original: <span className="font-mono">{url.originalUrl}</span>
                      </div>
                      <div className="text-xs text-gray-500">Created: {url.createdAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/analytics/${url.shortCode}`, "_blank")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(`/${url.shortCode}`, "_blank")}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteUrl(url.id)}>
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
