"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Copy, BarChart3, Clock, MousePointer, TrendingUp, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { subscribeToTopUrls } from "@/lib/analytics-unified"

interface TopUrl {
  shortCode: string
  clicks: number
  originalUrl: string
}

export function RealTimeDashboard() {
  const [topUrls, setTopUrls] = useState<TopUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const initializeSubscription = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if we're in a browser environment
        if (typeof window === "undefined") {
          setError("Dashboard requires client-side rendering")
          setLoading(false)
          return
        }

        // Subscribe to top URLs from unified structure
        unsubscribe = subscribeToTopUrls((urls) => {
          console.log("📊 Dashboard received unified top URLs:", urls)
          setTopUrls(urls)
          setLoading(false)
        }, 10)
      } catch (err) {
        console.error("❌ Dashboard subscription error:", err)
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
        setLoading(false)
      }
    }

    initializeSubscription()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

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

  if (error) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-800">{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Real-Time Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your shortened URLs and view analytics in real-time</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total URLs</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? <Skeleton className="h-8 w-16" /> : topUrls.length}
            </div>
            <p className="text-xs text-gray-500">Active short URLs</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                topUrls.reduce((sum, url) => sum + url.clicks, 0).toLocaleString()
              )}
            </div>
            <p className="text-xs text-gray-500">Across all URLs</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Top Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : topUrls.length > 0 ? (
                `${topUrls[0].clicks} clicks`
              ) : (
                "No data"
              )}
            </div>
            <p className="text-xs text-gray-500">
              {topUrls.length > 0 ? `/${topUrls[0].shortCode}` : "Create your first URL"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top URLs Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Top Performing URLs</CardTitle>
          <CardDescription className="text-gray-600">Real-time view of your most clicked short URLs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : topUrls.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">No URLs yet</h3>
              <p className="text-gray-600 mb-4">Create your first short URL to see analytics here</p>
              <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                <a href="/">Create Short URL</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {topUrls.map((url, index) => (
                <div
                  key={url.shortCode}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={index === 0 ? "default" : "secondary"}
                        className={index === 0 ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700"}
                      >
                        #{index + 1}
                      </Badge>
                      <code className="text-sm font-mono bg-purple-50 text-purple-700 px-2 py-1 rounded">
                        /{url.shortCode}
                      </code>
                    </div>
                    <p className="text-sm text-gray-600 truncate" title={url.originalUrl}>
                      {url.originalUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 flex items-center gap-1">
                      <MousePointer className="h-3 w-3" />
                      {url.clicks.toLocaleString()}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(url.shortCode)}
                      title="Copy short URL"
                      className="text-purple-600 hover:bg-purple-50"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openUrl(url.shortCode)}
                      title="Open short URL"
                      className="text-purple-600 hover:bg-purple-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAnalytics(url.shortCode)}
                      title="View analytics"
                      className="text-purple-600 hover:bg-purple-50"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Real-time updates</span>
        </div>
        <Clock className="h-4 w-4" />
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  )
}
