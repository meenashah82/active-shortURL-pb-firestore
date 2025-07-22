"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, ExternalLink, Search, RefreshCw } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore"

interface UrlData {
  id: string
  shortCode: string
  originalUrl: string
  createdAt: string
  totalClicks: number
}

export function AdminDashboard() {
  const [urls, setUrls] = useState<UrlData[]>([])
  const [filteredUrls, setFilteredUrls] = useState<UrlData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUrls = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!db) {
        throw new Error("Database not initialized")
      }

      const urlsQuery = query(collection(db, "urls"), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(urlsQuery)

      const urlsData: UrlData[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        urlsData.push({
          id: doc.id,
          shortCode: data.shortCode || doc.id,
          originalUrl: data.originalUrl || data.url || "",
          createdAt: data.createdAt || "",
          totalClicks: data.totalClicks || 0,
        })
      })

      setUrls(urlsData)
      setFilteredUrls(urlsData)
    } catch (error) {
      console.error("Error fetching URLs:", error)
      setError(`Failed to fetch URLs: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteUrl = async (id: string) => {
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

  useEffect(() => {
    if (searchTerm) {
      const filtered = urls.filter(
        (url) =>
          url.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
          url.shortCode.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUrls(filtered)
    } else {
      setFilteredUrls(urls)
    }
  }, [searchTerm, urls])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">URL Management</h2>
          <p className="text-gray-600">Manage all shortened URLs in the system</p>
        </div>
        <Button onClick={fetchUrls} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>URLs ({filteredUrls.length})</CardTitle>
          <CardDescription>All shortened URLs in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search URLs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
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
                {filteredUrls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No URLs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUrls.map((url) => (
                    <TableRow key={url.id}>
                      <TableCell className="font-mono">
                        <Badge variant="secondary">{url.shortCode}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{url.originalUrl}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{url.totalClicks}</Badge>
                      </TableCell>
                      <TableCell>{new Date(url.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => window.open(url.originalUrl, "_blank")}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteUrl(url.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
