"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { getFirebase } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Trash2, ExternalLink, BarChart3 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

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

  const fetchUrls = async () => {
    const { db } = getFirebase()

    if (!db) {
      setError("Database connection not available")
      setLoading(false)
      return
    }

    try {
      const urlsCollection = collection(db, "urls")
      const snapshot = await getDocs(urlsCollection)

      const urlsData: UrlData[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          originalUrl: data.originalUrl,
          shortCode: data.shortCode,
          createdAt: data.createdAt?.toDate() || new Date(),
          clicks: data.clicks || 0,
        }
      })

      // Sort by creation date (newest first)
      urlsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      setUrls(urlsData)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching URLs:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteUrl = async (id: string, shortCode: string) => {
    const { db } = getFirebase()

    if (!db) {
      toast({
        title: "Error",
        description: "Database connection not available",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteDoc(doc(db, "urls", id))
      setUrls(urls.filter((url) => url.id !== id))
      toast({
        title: "Success",
        description: `Short URL ${shortCode} deleted successfully`,
      })
    } catch (err: any) {
      console.error("Error deleting URL:", err)
      toast({
        title: "Error",
        description: `Failed to delete URL: ${err.message}`,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchUrls()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>URL Management</CardTitle>
          <CardDescription>Loading URLs...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>URL Management</CardTitle>
          <CardDescription>Error loading URLs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchUrls}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            URL Management
            <Button onClick={fetchUrls} variant="outline" size="sm">
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>Manage all shortened URLs. Total URLs: {urls.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {urls.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">No URLs found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Short Code</TableHead>
                    <TableHead>Original URL</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={url.originalUrl}>
                          {url.originalUrl}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{url.createdAt.toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{url.clicks}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://www.wodify.link/${url.shortCode}`, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/analytics/${url.shortCode}`, "_blank")}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Short URL</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the short URL "{url.shortCode}"? This action cannot be
                                  undone and the link will no longer work.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUrl(url.id, url.shortCode)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
