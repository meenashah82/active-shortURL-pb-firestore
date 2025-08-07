"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getFirebase } from "@/lib/firebase"
import { collection, getDocs, deleteDoc, doc, onSnapshot } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, ExternalLink, BarChart3, AlertTriangle } from 'lucide-react'
import { getSession } from "@/lib/admin-auth"
import { removeAllClicksData } from "@/lib/admin"

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
  const router = useRouter()

  // Check if current user is superadmin
  const session = getSession()
  const isSuperAdmin = session?.role === "superadmin"

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
          shortCode: data.shortCode || doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          totalClicks: data.totalClicks || 0,
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

  const openUrl = (shortCode: string) => {
    const shortUrl = `https://www.wodify.link/${shortCode}`
    window.open(shortUrl, "_blank")
  }

  const openAnalytics = (shortCode: string) => {
    router.push(`/analytics/${shortCode}`)
  }

  // Set up real-time listeners for URL updates
  useEffect(() => {
    const { db } = getFirebase()
    if (!db || urls.length === 0) return

    const unsubscribers: (() => void)[] = []

    // Set up real-time listener for each URL
    urls.forEach((url) => {
      const urlRef = doc(db, "urls", url.id)

      const unsubscribe = onSnapshot(
        urlRef,
        { includeMetadataChanges: true },
        (doc) => {
          if (doc.exists()) {
            const urlData = doc.data()
            const totalClicks = urlData.totalClicks || 0

            // Update the specific URL's click count in state
            setUrls((prevUrls) =>
              prevUrls.map((prevUrl) => (prevUrl.id === url.id ? { ...prevUrl, totalClicks } : prevUrl)),
            )
          }
        },
        (error) => {
          console.error(`Error listening to URL ${url.id}:`, error)
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
      <div className="space-y-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Admin Dashboard</CardTitle>
            <CardDescription className="text-gray-600">Loading URL data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-gray-600">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage shortened URLs and view analytics</p>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
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
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total URLs</CardTitle>
            <ExternalLink className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">{urls.length}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Clicks</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {urls.reduce((sum, url) => sum + url.totalClicks, 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Clicks</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {urls.length > 0 ? Math.round(urls.reduce((sum, url) => sum + url.totalClicks, 0) / urls.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* URLs Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">All Shortened URLs</CardTitle>
          <CardDescription className="text-gray-600">Manage and monitor your shortened URLs</CardDescription>
        </CardHeader>
        <CardContent>
          {urls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No URLs found. Create your first shortened URL!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Short Code</TableHead>
                    <TableHead className="text-gray-600">Original URL</TableHead>
                    <TableHead className="text-gray-600">Clicks</TableHead>
                    <TableHead className="text-gray-600">Created</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {urls.map((url) => (
                    <TableRow key={url.id} className="border-gray-200">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="border-purple-300 text-purple-600">
                            {url.shortCode}
                          </Badge>
                          <button
                            onClick={() => openUrl(url.shortCode)}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-gray-900" title={url.originalUrl}>
                          {url.originalUrl}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          {url.totalClicks}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{url.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAnalytics(url.shortCode)}
                            className="border-purple-300 text-purple-600 hover:bg-purple-50"
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUrl(url.id, url.shortCode)}
                            className="bg-red-600 hover:bg-red-700"
                          >
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
