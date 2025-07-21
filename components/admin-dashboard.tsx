"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, ExternalLink, Search, RefreshCw, BarChart3 } from "lucide-react"
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface UrlData {
  id: string
  originalUrl: string
  shortCode: string
  createdAt: any
  totalClicks: number
  isActive: boolean
}

export function AdminDashboard() {
  const [urls, setUrls] = useState<UrlData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  const fetchUrls = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!db) {
        setError("Database not initialized")
        return
      }

      const urlsRef = collection(db, "urls")
      const q = query(urlsRef, orderBy("createdAt", "desc"), limit(100))
      const snapshot = await getDocs(q)

      const urlsData: UrlData[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        urlsData.push({
          id: doc.id,
          originalUrl: data.originalUrl || "",
          shortCode: data.shortCode || doc.id,
          createdAt: data.createdAt,
          totalClicks: data.totalClicks || 0,
          isActive: data.isActive !== false,
        })
      })

      setUrls(urlsData)
    } catch (error) {
      console.error("Error fetching URLs:", error)
      setError("Failed to fetch URLs. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const deleteUrl = async (id: string) => {
    if (!confirm("Are you sure you want to delete this URL?")) return

    try {
      if (!db) {
        alert("Database not initialized")
        return
      }

      await deleteDoc(doc(db, "urls", id))
      setUrls(urls.filter((url) => url.id !== id))
    } catch (error) {
      console.error("Error deleting URL:", error)
      alert("Failed to delete URL")
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown"
    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString()
      } else if (timestamp.toDate) {
        return timestamp.toDate().toLocaleString()
      } else {
        return new Date(timestamp).toLocaleString()
      }
    } catch {
      return "Invalid date"
    }
  }

  const filteredUrls = urls.filter(
    (url) =>
      url.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.shortCode.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    fetchUrls()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading URLs...
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button onClick={fetchUrls} variant="outline" size="sm" className="ml-2 bg-transparent">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium">Active URLs</CardTitle>
            <Badge variant="default">{urls.filter((url) => url.isActive).length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urls.filter((url) => url.isActive).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search URLs or short codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchUrls} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* URLs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All URLs ({filteredUrls.length})</CardTitle>
          <CardDescription>Manage all shortened URLs in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUrls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No URLs match your search" : "No URLs found"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUrls.map((url) => (
                <div key={url.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={url.isActive ? "default" : "secondary"}>
                          {url.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {url.totalClicks} click{url.totalClicks !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Short:</span>
                          <a
                            href={`/${url.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {window.location.origin}/{url.shortCode}
                          </a>
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </div>

                        <div className="flex items-start space-x-2">
                          <span className="text-sm font-medium">Original:</span>
                          <span className="text-sm text-gray-600 break-all">{url.originalUrl}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Created:</span>
                          <span className="text-sm text-gray-500">{formatDate(url.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/analytics/${url.shortCode}`, "_blank")}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteUrl(url.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
