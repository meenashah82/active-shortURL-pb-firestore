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
  originalUrl: string
  shortCode: string
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
    if (!db) {
      setError("Database not initialized")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const q = query(collection(db, "urls"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const urlsData: UrlData[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        urlsData.push({
          id: doc.id,
          originalUrl: data.originalUrl,
          shortCode: data.shortCode,
          createdAt: data.createdAt,
          totalClicks: data.totalClicks || 0,
        })
      })

      setUrls(urlsData)
      setFilteredUrls(urlsData)
      setError(null)
    } catch (error) {
      console.error("Error fetching URLs:", error)
      setError("Failed to fetch URLs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, shortCode: string) => {
    if (!db) return

    if (!confirm(`Are you sure you want to delete the URL with code "${shortCode}"?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, "urls", id))
      await fetchUrls() // Refresh the list
    } catch (error) {
      console.error("Error deleting URL:", error)
      setError("Failed to delete URL")
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (!term) {
      setFilteredUrls(urls)
    } else {
      const filtered = urls.filter(
        (url) =>
          url.originalUrl.toLowerCase().includes(term.toLowerCase()) ||
          url.shortCode.toLowerCase().includes(term.toLowerCase()),
      )
      setFilteredUrls(filtered)
    }
  }

  useEffect(() => {
    fetchUrls()
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">URL Management</h2>
          <p className="text-gray-600">Manage all shortened URLs</p>
        </div>
        <Button onClick={fetchUrls} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search URLs</CardTitle>
          <CardDescription>Search by original URL or short code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search URLs..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>URLs ({filteredUrls.length})</CardTitle>
          <CardDescription>All shortened URLs in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUrls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No URLs found matching your search" : "No URLs found"}
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
                  {filteredUrls.map((url) => (
                    <TableRow key={url.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{url.shortCode}</Badge>
                          <Button variant="ghost" size="sm" onClick={() => window.open(`/${url.shortCode}`, "_blank")}>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(url.id, url.shortCode)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
