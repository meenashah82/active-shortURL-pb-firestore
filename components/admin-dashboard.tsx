"use client"

import { useState, useEffect } from "react"
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
import { Trash2, ExternalLink, BarChart3, AlertTriangle } from "lucide-react"
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState<string | null>(null)

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

  const handleRemoveAllData = async () => {
    setIsDeleting(true)
    setDeleteResult(null)
    setError(null)

    try {
      const result = await removeAllClicksData()

      if (result.success) {
        setDeleteResult(
          `Successfully deleted all data:\n` +
            `• URLs: ${result.deletedCounts.urls}\n` +
            `• Analytics: ${result.deletedCounts.analytics}\n` +
            `• Clicks: ${result.deletedCounts.clicks}\n` +
            `• Subcollections: ${result.deletedCounts.subcollections}`,
        )
        // Refresh the URLs list
        setUrls([])
      } else {
        setError(`Failed to delete all data: ${result.error}`)
      }
    } catch (error: any) {
      setError(`Error during deletion: ${error.message}`)
    } finally {
      setIsDeleting(false)
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
      <div className="space-y-6">
        <Card className="shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
          <CardHeader>
            <CardTitle style={{ color: "#4D475B" }}>Admin Dashboard</CardTitle>
            <CardDescription style={{ color: "#94909C" }}>Loading URL data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: "#833ADF" }}></div>
              <span style={{ color: "#94909C" }}>Loading...</span>
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
          <h1 className="text-2xl font-semibold" style={{ color: "#4D475B" }}>
            Admin Dashboard
          </h1>
          <p className="mt-1" style={{ color: "#94909C" }}>
            Manage shortened URLs and view analytics
          </p>
        </div>

        {/* Super Admin Only: Remove All Data Button */}
        {isSuperAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isDeleting}
                style={{ backgroundColor: "#F22C7C", color: "#FFFFFF" }}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Remove All Data"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center" style={{ color: "#F22C7C" }}>
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Dangerous Operation
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2" style={{ color: "#4D475B" }}>
                  <p className="font-semibold">This will permanently delete ALL data from:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>All shortened URLs</li>
                    <li>All analytics data</li>
                    <li>All click tracking data</li>
                    <li>All subcollection data</li>
                  </ul>
                  <p className="font-semibold mt-4" style={{ color: "#F22C7C" }}>
                    This action cannot be undone. Are you absolutely sure?
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel style={{ borderColor: "#D9D8FD", color: "#4D475B" }}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemoveAllData}
                  disabled={isDeleting}
                  style={{ backgroundColor: "#F22C7C", color: "#FFFFFF" }}
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {error && (
        <Alert style={{ borderColor: "#F22C7C", backgroundColor: "rgba(242, 44, 124, 0.1)" }}>
          <AlertDescription style={{ color: "#F22C7C" }}>
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

      {deleteResult && (
        <Alert style={{ borderColor: "#833ADF", backgroundColor: "rgba(131, 58, 223, 0.1)" }}>
          <AlertDescription className="whitespace-pre-line" style={{ color: "#833ADF" }}>
            {deleteResult}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: "#94909C" }}>
              Total URLs
            </CardTitle>
            <ExternalLink className="h-4 w-4" style={{ color: "#833ADF" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" style={{ color: "#4D475B" }}>
              {urls.length}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: "#94909C" }}>
              Total Clicks
            </CardTitle>
            <BarChart3 className="h-4 w-4" style={{ color: "#833ADF" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" style={{ color: "#4D475B" }}>
              {urls.reduce((sum, url) => sum + url.totalClicks, 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: "#94909C" }}>
              Average Clicks
            </CardTitle>
            <BarChart3 className="h-4 w-4" style={{ color: "#833ADF" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" style={{ color: "#4D475B" }}>
              {urls.length > 0 ? Math.round(urls.reduce((sum, url) => sum + url.totalClicks, 0) / urls.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* URLs Table */}
      <Card className="shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
        <CardHeader>
          <CardTitle style={{ color: "#4D475B" }}>All Shortened URLs</CardTitle>
          <CardDescription style={{ color: "#94909C" }}>Manage and monitor your shortened URLs</CardDescription>
        </CardHeader>
        <CardContent>
          {urls.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: "#94909C" }}>No URLs found. Create your first shortened URL!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: "#D9D8FD" }}>
                    <TableHead style={{ color: "#94909C" }}>Short Code</TableHead>
                    <TableHead style={{ color: "#94909C" }}>Original URL</TableHead>
                    <TableHead style={{ color: "#94909C" }}>Clicks</TableHead>
                    <TableHead style={{ color: "#94909C" }}>Created</TableHead>
                    <TableHead style={{ color: "#94909C" }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {urls.map((url) => (
                    <TableRow key={url.id} style={{ borderColor: "#D9D8FD" }}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" style={{ borderColor: "#D9D8FD", color: "#833ADF" }}>
                            {url.shortCode}
                          </Badge>
                          <a
                            href={`https://www.wodify.link/${url.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#833ADF" }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={url.originalUrl} style={{ color: "#4D475B" }}>
                          {url.originalUrl}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: "rgba(131, 58, 223, 0.1)", color: "#833ADF" }}
                        >
                          {url.totalClicks}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: "#94909C" }}>{url.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/analytics/${url.shortCode}`, "_blank")}
                            style={{ borderColor: "#D9D8FD", color: "#833ADF" }}
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUrl(url.id, url.shortCode)}
                            style={{ backgroundColor: "#F22C7C", color: "#FFFFFF" }}
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
