"use client"

import { useState, useEffect } from "react"
import { getFirebase } from "@/lib/firebase"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, ExternalLink, BarChart3 } from "lucide-react"
import Link from "next/link"

interface UrlData {
  id: string
  originalUrl: string
  shortCode: string
  createdAt: string
  totalClicks: number
}

export function AdminDashboard() {
  const [urls, setUrls] = useState<UrlData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUrls = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { db } = getFirebase()

      if (!db) {
        setError("Firebase Firestore is not available. Please enable it in your Firebase project console.")
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
          createdAt: data.createdAt || "",
          totalClicks: data.totalClicks || 0,
        })
      })

      // Sort by creation date (newest first)
      urlsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setUrls(urlsData)
    } catch (error: any) {
      console.error("Error fetching URLs:", error)
      if (error.message.includes("service firestore is not available")) {
        setError("Firebase Firestore is not available. Please enable it in your Firebase project console.")
      } else {
        setError(`Failed to fetch URLs: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">URL Management</h2>
          <Button disabled>Refresh</Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
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
          <AlertDescription>
            <strong>Configuration Error</strong>
            <br />
            {error}
            <br />
            <br />
            <strong>Action Required:</strong> Go to your Firebase Console, select 'Firestore Database' from the Build
            menu, and click 'Create database'.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">URL Management</h2>
          <p className="text-muted-foreground">Manage all shortened URLs ({urls.length} total)</p>
        </div>
        <Button onClick={fetchUrls}>Refresh</Button>
      </div>

      {urls.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No URLs found. Create your first short URL!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {urls.map((url) => (
            <Card key={url.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{url.originalUrl}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">/{url.shortCode}</code>
                      <Badge variant="outline">{url.totalClicks} clicks</Badge>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/analytics/${url.shortCode}`}>
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/${url.shortCode}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Visit
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteUrl(url.id, url.shortCode)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground">Created: {new Date(url.createdAt).toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
