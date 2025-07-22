"use client"

import { useState, useEffect } from "react"
import { getFirebase } from "@/lib/firebase"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
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
  clicks: number
}

export function AdminDashboard() {
  const [urls, setUrls] = useState<UrlData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalUrls: 0,
    totalClicks: 0,
  })

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
          shortCode: data.shortCode || doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          clicks: data.clicks || 0,
        }
      })

      // Sort by creation date (newest first)
      urlsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      setUrls(urlsData)

      // Calculate stats
      const totalClicks = urlsData.reduce((sum, url) => sum + url.clicks, 0)
      setStats({
        totalUrls: urlsData.length,
        totalClicks,
      })
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
      await fetchUrls() // Refresh the list
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">URL Management</h2>
          <Button disabled>Loading...</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">URL Management</h2>
          <Button onClick={fetchUrls}>Retry</Button>
        </div>
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        {error.includes("Firestore is not available") && (
          <Card>
            <CardHeader>
              <CardTitle>Configuration Error</CardTitle>
              <CardDescription>
                Firebase Firestore is not available. Please enable it in your Firebase project console.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Action Required:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to your Firebase Console</li>
                  <li>Select 'Firestore Database' from the Build menu</li>
                  <li>Click 'Create database'</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">URL Management</h2>
        <Button onClick={fetchUrls}>Refresh</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total URLs</p>
                <p className="text-2xl font-bold">{stats.totalUrls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{stats.totalClicks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* URLs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Short URLs</CardTitle>
          <CardDescription>Manage all shortened URLs in your system</CardDescription>
        </CardHeader>
        <CardContent>
          {urls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No URLs found</p>
            </div>
          ) : (
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
                        <Badge variant="outline" className="font-mono">
                          {url.shortCode}
                        </Badge>
                        <a
                          href={`https://www.wodify.link/${url.shortCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={url.originalUrl}>
                        {url.originalUrl}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{url.clicks}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">{url.createdAt.toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/analytics/${url.shortCode}`, "_blank")}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUrl(url.id, url.shortCode)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
