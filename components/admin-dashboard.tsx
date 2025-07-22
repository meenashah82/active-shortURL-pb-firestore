"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, ExternalLink, AlertTriangle } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore"

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
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadUrls()
  }, [])

  const loadUrls = async () => {
    if (!db) {
      setError("Database not initialized")
      setIsLoading(false)
      return
    }

    try {
      const q = query(collection(db, "urls"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const urlsData: UrlData[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        originalUrl: doc.data().originalUrl,
        shortCode: doc.data().shortCode,
        createdAt: doc.data().createdAt,
        totalClicks: doc.data().totalClicks || 0,
      }))

      setUrls(urlsData)
    } catch (error) {
      console.error("Error loading URLs:", error)
      setError("Failed to load URLs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, shortCode: string) => {
    if (!db) {
      setError("Database not initialized")
      return
    }

    if (!confirm(`Are you sure you want to delete the URL with code "${shortCode}"?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, "urls", id))
      setUrls(urls.filter((url) => url.id !== id))
    } catch (error) {
      console.error("Error deleting URL:", error)
      setError("Failed to delete URL")
    }
  }

  const filteredUrls = urls.filter(
    (url) =>
      url.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.shortCode.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">URL Management</h2>
          <p className="text-gray-600">Manage all shortened URLs in the system</p>
        </div>
        <Badge variant="secondary">{urls.length} Total URLs</Badge>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search URLs or short codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={loadUrls} variant="outline">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All URLs</CardTitle>
          <CardDescription>
            {filteredUrls.length} of {urls.length} URLs shown
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {filteredUrls.map((url) => (
                <TableRow key={url.id}>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{url.shortCode}</code>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={url.originalUrl}>
                      {url.originalUrl}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{url.totalClicks}</Badge>
                  </TableCell>
                  <TableCell>{new Date(url.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => window.open(`/${url.shortCode}`, "_blank")}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(url.id, url.shortCode)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUrls.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No URLs match your search" : "No URLs found"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
