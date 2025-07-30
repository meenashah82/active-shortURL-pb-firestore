"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Copy, BarChart3, Clock, MousePointer, TrendingUp, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { subscribeToTopUrls } from "@/lib/analytics-clean"

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

        // Subscribe to top URLs
        unsubscribe = subscribeToTopUrls((urls) => {
          console.log("📊 Dashboard received top URLs:", urls)
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
      <Alert variant="destructive" style={{ borderColor: "#F22C7C", backgroundColor: "rgba(242, 44, 124, 0.1)" }}>
        <AlertCircle className="h-4 w-4" style={{ color: "#F22C7C" }} />
        <AlertDescription style={{ color: "#F22C7C" }}>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#4D475B" }}>
            Real-Time Dashboard
          </h1>
          <p className="mt-1" style={{ color: "#94909C" }}>
            Monitor your shortened URLs and view analytics in real-time
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: "#94909C" }}>
              Total URLs
            </CardTitle>
            <BarChart3 className="h-4 w-4" style={{ color: "#833ADF" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" style={{ color: "#4D475B" }}>
              {loading ? <Skeleton className="h-8 w-16" style={{ backgroundColor: "#D9D8FD" }} /> : topUrls.length}
            </div>
            <p className="text-xs" style={{ color: "#94909C" }}>
              Active short URLs
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: "#94909C" }}>
              Total Clicks
            </CardTitle>
            <MousePointer className="h-4 w-4" style={{ color: "#833ADF" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" style={{ color: "#4D475B" }}>
              {loading ? (
                <Skeleton className="h-8 w-16" style={{ backgroundColor: "#D9D8FD" }} />
              ) : (
                topUrls.reduce((sum, url) => sum + url.clicks, 0).toLocaleString()
              )}
            </div>
            <p className="text-xs" style={{ color: "#94909C" }}>
              Across all URLs
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: "#94909C" }}>
              Top Performer
            </CardTitle>
            <TrendingUp className="h-4 w-4" style={{ color: "#833ADF" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" style={{ color: "#4D475B" }}>
              {loading ? (
                <Skeleton className="h-8 w-16" style={{ backgroundColor: "#D9D8FD" }} />
              ) : topUrls.length > 0 ? (
                `${topUrls[0].clicks} clicks`
              ) : (
                "No data"
              )}
            </div>
            <p className="text-xs" style={{ color: "#94909C" }}>
              {topUrls.length > 0 ? `/${topUrls[0].shortCode}` : "Create your first URL"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top URLs Table */}
      <Card className="shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
        <CardHeader>
          <CardTitle style={{ color: "#4D475B" }}>Top Performing URLs</CardTitle>
          <CardDescription style={{ color: "#94909C" }}>Real-time view of your most clicked short URLs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  style={{ borderColor: "#D9D8FD" }}
                >
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" style={{ backgroundColor: "#D9D8FD" }} />
                    <Skeleton className="h-3 w-64" style={{ backgroundColor: "#D9D8FD" }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16" style={{ backgroundColor: "#D9D8FD" }} />
                    <Skeleton className="h-8 w-8" style={{ backgroundColor: "#D9D8FD" }} />
                    <Skeleton className="h-8 w-8" style={{ backgroundColor: "#D9D8FD" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : topUrls.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" style={{ color: "#94909C" }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#4D475B" }}>
                No URLs yet
              </h3>
              <p className="mb-4" style={{ color: "#94909C" }}>
                Create your first short URL to see analytics here
              </p>
              <Button asChild style={{ backgroundColor: "#833ADF", color: "#FFFFFF" }}>
                <a href="/">Create Short URL</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {topUrls.map((url, index) => (
                <div
                  key={url.shortCode}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-opacity-50 transition-colors"
                  style={{
                    borderColor: "#D9D8FD",
                    backgroundColor: "rgba(217, 216, 253, 0.1)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={index === 0 ? "default" : "secondary"}
                        style={{
                          backgroundColor: index === 0 ? "#833ADF" : "#D9D8FD",
                          color: index === 0 ? "#FFFFFF" : "#833ADF",
                        }}
                      >
                        #{index + 1}
                      </Badge>
                      <code
                        className="text-sm font-mono px-2 py-1 rounded"
                        style={{ backgroundColor: "rgba(131, 58, 223, 0.1)", color: "#833ADF" }}
                      >
                        /{url.shortCode}
                      </code>
                    </div>
                    <p className="text-sm truncate" title={url.originalUrl} style={{ color: "#94909C" }}>
                      {url.originalUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                      style={{ backgroundColor: "rgba(131, 58, 223, 0.1)", color: "#833ADF" }}
                    >
                      <MousePointer className="h-3 w-3" />
                      {url.clicks.toLocaleString()}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(url.shortCode)}
                      title="Copy short URL"
                      style={{ color: "#833ADF" }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openUrl(url.shortCode)}
                      title="Open short URL"
                      style={{ color: "#833ADF" }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAnalytics(url.shortCode)}
                      title="View analytics"
                      style={{ color: "#833ADF" }}
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
      <div className="flex items-center justify-center gap-2 text-sm" style={{ color: "#94909C" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#833ADF" }}></div>
          <span>Real-time updates</span>
        </div>
        <Clock className="h-4 w-4" />
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  )
}
