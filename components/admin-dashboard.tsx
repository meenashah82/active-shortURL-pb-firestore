"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import {
  Search,
  Shield,
  ShieldOff,
  ExternalLink,
  Copy,
  BarChart3,
  MousePointer,
  Link,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllUrls, searchUrls, deactivateUrl, reactivateUrl, getAdminStats, type AdminUrlData } from "@/lib/admin"

export function AdminDashboard() {
  const [urls, setUrls] = useState<AdminUrlData[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalUrls: 0,
    activeUrls: 0,
    inactiveUrls: 0,
    totalClicks: 0,
  })
  const { toast } = useToast()

  const loadUrls = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getAllUrls(50) // Load first 50 URLs
      setUrls(result.urls)
    } catch (err) {
      console.error("Error loading URLs:", err)
      setError(err instanceof Error ? err.message : "Failed to load URLs")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const adminStats = await getAdminStats()
      setStats(adminStats)
    } catch (err) {
      console.error("Error loading stats:", err)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadUrls()
      return
    }

    try {
      setSearching(true)
      setError(null)
      const results = await searchUrls(searchTerm.trim())
      setUrls(results)
    } catch (err) {
      console.error("Error searching URLs:", err)
      setError(err instanceof Error ? err.message : "Search failed")
    } finally {
      setSearching(false)
    }
  }

  const handleDeactivate = async (shortCode: string) => {
    try {
      await deactivateUrl(shortCode)
      toast({
        title: "URL Deactivated",
        description: `Short URL /${shortCode} has been deactivated`,
      })
      // Refresh the list
      if (searchTerm) {
        handleSearch()
      } else {
        loadUrls()
      }
      loadStats()
    } catch (err) {
      toast({
        title: "Deactivation Failed",
        description: err instanceof Error ? err.message : "Failed to deactivate URL",
        variant: "destructive",
      })
    }
  }

  const handleReactivate = async (shortCode: string) => {
    try {
      await reactivateUrl(shortCode)
      toast({
        title: "URL Reactivated",
        description: `Short URL /${shortCode} has been reactivated`,
      })
      // Refresh the list
      if (searchTerm) {
        handleSearch()
      } else {
        loadUrls()
      }
      loadStats()
    } catch (err) {
      toast({
        title: "Reactivation Failed",
        description: err instanceof Error ? err.message : "Failed to reactivate URL",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async (shortCode: string) => {
    try {
      const shortUrl = `${window.location.origin}/${shortCode}`
      await navigator.clipboard.writeText(shortUrl)
      toast({
        title: "Copied!",
        description: "Short URL copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy URL to clipboard",
        variant: "destructive",
      })
    }
  }

  const openUrl = (shortCode: string) => {
    const shortUrl = `${window.location.origin}/${shortCode}`
    window.open(shortUrl, "_blank")
  }

  const openAnalytics = (shortCode: string) => {
    window.open(`/analytics/${shortCode}`, "_blank")
  }

  useEffect(() => {
    loadUrls()
    loadStats()
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUrls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All short URLs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active URLs</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUrls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive URLs</CardTitle>
            <ShieldOff className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactiveUrls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Deactivated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time clicks</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin URL Management
          </CardTitle>
          <CardDescription>Search, view, and manage all short URLs in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by short code or original URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="h-4 w-4 mr-2" />
              {searching ? "Searching..." : "Search"}
            </Button>
            <Button variant="outline" onClick={loadUrls} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* URLs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Short Code</TableHead>
                  <TableHead>Original URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-64" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : urls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? "No URLs found matching your search" : "No URLs created yet"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  urls.map((url) => (
                    <TableRow key={url.id}>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">/{url.shortCode}</code>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={url.originalUrl}>
                          {url.originalUrl}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={url.isActive ? "default" : "destructive"}>
                          {url.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MousePointer className="h-3 w-3" />
                          {url.clicks.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {url.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(url.shortCode)}
                            title="Copy URL"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openUrl(url.shortCode)} title="Open URL">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAnalytics(url.shortCode)}
                            title="View Analytics"
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>

                          {url.isActive ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="Deactivate URL">
                                  <ShieldOff className="h-3 w-3 text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deactivate URL</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to deactivate /{url.shortCode}? This will make the short URL
                                    inaccessible to users.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeactivate(url.shortCode)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Deactivate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="Reactivate URL">
                                  <Shield className="h-3 w-3 text-green-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reactivate URL</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reactivate /{url.shortCode}? This will make the short URL
                                    accessible to users again.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleReactivate(url.shortCode)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Reactivate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
