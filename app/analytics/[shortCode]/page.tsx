"use client"

import React from "react"
import { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, ExternalLink, Calendar, Globe, Loader2, Zap, Target, Activity, Wifi, WifiOff, RefreshCw, Clock, Monitor, Smartphone, MapPin } from 'lucide-react'
import Link from "next/link"
import { useRealTimeAnalytics } from "@/hooks/use-real-time-analytics"
import { useClickHistory } from "@/hooks/use-click-history"
import { RealTimeClickTracker } from "@/lib/real-time-tracker"

interface AnalyticsPageProps {
  params: Promise<{ shortCode: string }>
}

export default function AnalyticsPage({ params }: AnalyticsPageProps) {
  const [shortCode, setShortCode] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(true)

  // Unwrap params promise
  React.useEffect(() => {
    params.then((resolvedParams) => {
      setShortCode(resolvedParams.shortCode)
      setIsLoading(false)
    })
  }, [params])

  const { urlData, analyticsData, loading, error, connectionStatus, clickCount, isNewClick, lastUpdate } =
    useRealTimeAnalytics(shortCode)

  const { clickHistory, loading: historyLoading } = useClickHistory(shortCode, 100)

  const trackerRef = useRef<RealTimeClickTracker | null>(null)

  // Initialize tracker for analytics page interactions
  React.useEffect(() => {
    if (shortCode) {
      trackerRef.current = new RealTimeClickTracker(shortCode)
      return () => {
        if (trackerRef.current) {
          trackerRef.current.destroy()
        }
      }
    }
  }, [shortCode])

  // Track analytics page interactions (does NOT increment click count)
  const trackAnalyticsClick = async (element: string, coordinates?: { x: number; y: number }) => {
    if (trackerRef.current) {
      await trackerRef.current.trackClick("analytics_page", {
        element,
        coordinates,
        timestamp: new Date().toISOString(),
      })
    }
  }

  const handleElementClick = (element: string) => (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const coordinates = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    trackAnalyticsClick(element, coordinates)
  }

  // Helper function to format user agent
  const formatUserAgent = (userAgent?: string) => {
    if (!userAgent) return "Unknown"

    // Extract browser info
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"

    return userAgent.substring(0, 30) + "..."
  }

  // Helper function to format referrer
  const formatReferrer = (referer?: string) => {
    if (!referer || referer === "") return "Direct"

    try {
      const url = new URL(referer)
      return url.hostname
    } catch {
      return referer.substring(0, 30) + "..."
    }
  }

  // Helper function to get device icon
  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" style={{ color: "#94909C" }} />

    if (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone")) {
      return <Smartphone className="h-4 w-4" style={{ color: "#94909C" }} />
    }

    return <Monitor className="h-4 w-4" style={{ color: "#94909C" }} />
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#833ADF" }} />
          <span className="font-medium" style={{ color: "#4D475B" }}>
            Loading real-time analytics...
          </span>
        </div>
      </div>
    )
  }

  if (error || !urlData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFFFFF" }}>
        <Card className="max-w-md w-full mx-4 shadow-lg" style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" style={{ color: "#4D475B" }}>
              Error Loading Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4" style={{ color: "#94909C" }}>
              {error || "Failed to load analytics data"}
            </p>
            <Link href="/">
              <Button style={{ backgroundColor: "#833ADF", color: "#FFFFFF", border: "none" }}>Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const shortUrl = `${window.location.origin}/${shortCode}`

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Real-time Connection Status */}
          <Card
            className="mb-6 border-l-4 shadow-sm"
            style={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D9D8FD",
              borderLeftColor:
                connectionStatus === "connected"
                  ? "#833ADF"
                  : connectionStatus === "connecting"
                    ? "#F22C7C"
                    : "#94909C",
            }}
          >
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {connectionStatus === "connected" ? (
                    <Wifi className="h-4 w-4" style={{ color: "#833ADF" }} />
                  ) : connectionStatus === "connecting" ? (
                    <RefreshCw className="h-4 w-4 animate-spin" style={{ color: "#F22C7C" }} />
                  ) : (
                    <WifiOff className="h-4 w-4" style={{ color: "#94909C" }} />
                  )}

                  <span
                    className="text-sm font-medium"
                    style={{
                      color:
                        connectionStatus === "connected"
                          ? "#833ADF"
                          : connectionStatus === "connecting"
                            ? "#F22C7C"
                            : "#94909C",
                    }}
                  >
                    {connectionStatus === "connected"
                      ? "🔥 Real-time Firestore connected - Clicks update instantly!"
                      : connectionStatus === "connecting"
                        ? "Connecting to Firestore real-time updates..."
                        : "Connection lost - Attempting to reconnect..."}
                  </span>

                  {connectionStatus === "connected" && (
                    <Activity className="h-4 w-4 animate-pulse" style={{ color: "#833ADF" }} />
                  )}
                </div>

                <div className="text-xs" style={{ color: "#94909C" }}>
                  {lastUpdate && <span>Last update: {lastUpdate.toLocaleTimeString()}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                onClick={handleElementClick("back-button")}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#D9D8FD",
                  color: "#833ADF",
                }}
                className="hover:bg-opacity-10 bg-transparent"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(131, 58, 223, 0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold" style={{ color: "#4D475B" }}>
              Real-Time Analytics Dashboard
            </h1>
          </div>

          {/* Real-time Click Counter */}
          <Card
            className={`mb-8 transition-all duration-500 shadow-sm ${
              isNewClick ? "border-4 shadow-lg scale-[1.02]" : "border-2"
            }`}
            style={{
              backgroundColor: "#FFFFFF",
              borderColor: isNewClick ? "#F22C7C" : "#D9D8FD",
              boxShadow: isNewClick ? "0 10px 25px -5px rgba(242, 44, 124, 0.3)" : undefined,
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "#4D475B" }}>
                <Zap
                  className={`h-6 w-6 transition-all duration-300 ${isNewClick ? "animate-bounce scale-125" : ""}`}
                  style={{ color: isNewClick ? "#F22C7C" : "#833ADF" }}
                />
                Total Clicks (Real-time)
                {isNewClick && (
                  <div className="flex items-center gap-1 animate-pulse" style={{ color: "#F22C7C" }}>
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-bold">LIVE UPDATE!</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div
                  className={`text-8xl font-bold transition-all duration-700 ${
                    isNewClick ? "scale-110 drop-shadow-lg animate-pulse" : ""
                  }`}
                  style={{ color: isNewClick ? "#F22C7C" : "#833ADF" }}
                >
                  {clickCount}
                </div>
                <p className="mt-2 text-lg" style={{ color: "#94909C" }}>
                  Updates instantly via Firestore real-time listener when short URL is clicked
                </p>
                {isNewClick && (
                  <div
                    className="mt-4 p-4 rounded-lg border-2"
                    style={{
                      backgroundColor: "rgba(242, 44, 124, 0.1)",
                      borderColor: "#F22C7C",
                    }}
                  >
                    <div className="font-bold text-xl animate-bounce" style={{ color: "#F22C7C" }}>
                      🎉 Someone just clicked your short URL!
                    </div>
                    <div className="text-sm mt-2" style={{ color: "#F22C7C" }}>
                      Real-time update via Firestore onSnapshot - No refresh needed!
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* URL Info */}
          <Card className="mb-8 shadow-sm" style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "#4D475B" }}>
                <Globe className="h-5 w-5" style={{ color: "#833ADF" }} />
                URL Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium" style={{ color: "#4D475B" }}>
                  Short URL:
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code
                    className="flex-1 p-2 rounded text-sm border"
                    style={{
                      backgroundColor: "#D9D8FD",
                      color: "#4D475B",
                      borderColor: "#D9D8FD",
                    }}
                  >
                    {shortUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      handleElementClick("open-short-url")(e)
                      window.open(shortUrl, "_blank")
                    }}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#D9D8FD",
                      color: "#833ADF",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(131, 58, 223, 0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs mt-1" style={{ color: "#94909C" }}>
                  Click this link to test real-time analytics updates!
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: "#4D475B" }}>
                  Original URL:
                </label>
                <p className="text-sm mt-1 break-all" style={{ color: "#94909C" }}>
                  {urlData.originalUrl}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm" style={{ color: "#94909C" }}>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" style={{ color: "#94909C" }} />
                  Created {urlData.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Click History Table */}
          <Card className="mb-8 shadow-sm" style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "#4D475B" }}>
                <Clock className="h-5 w-5" style={{ color: "#833ADF" }} />
                Click History (Real-time)
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#F22C7C" }}></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" style={{ color: "#833ADF" }} />
                  <span style={{ color: "#4D475B" }}>Loading click history...</span>
                </div>
              ) : clickHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm mb-2" style={{ color: "#94909C" }}>
                    No clicks recorded yet
                  </p>
                  <p className="text-xs" style={{ color: "#94909C" }}>
                    Share your short URL to see detailed click analytics appear here!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ color: "#4D475B" }}>Timestamp</TableHead>
                        <TableHead style={{ color: "#4D475B" }}>User Agent</TableHead>
                        <TableHead style={{ color: "#4D475B" }}>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clickHistory.map((click, index) => (
                        <TableRow
                          key={click.id || index}
                          className={`transition-all duration-300 ${
                            index === 0 && isNewClick ? "bg-pink-50 border-pink-200" : ""
                          }`}
                          style={{
                            backgroundColor: index === 0 && isNewClick ? "rgba(242, 44, 124, 0.05)" : undefined,
                          }}
                        >
                          <TableCell style={{ color: "#4D475B" }}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" style={{ color: "#94909C" }} />
                              <span className="font-mono text-sm">
                                {click.timestamp?.toDate?.()?.toLocaleString() || "Just now"}
                              </span>
                              {index === 0 && isNewClick && (
                                <span
                                  className="text-xs font-bold animate-bounce px-2 py-1 rounded"
                                  style={{
                                    color: "#F22C7C",
                                    backgroundColor: "rgba(242, 44, 124, 0.1)",
                                  }}
                                >
                                  NEW!
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell style={{ color: "#4D475B" }}>
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(click["User-Agent"])}
                              <span className="text-sm">{formatUserAgent(click["User-Agent"]) || "Unknown"}</span>
                            </div>
                          </TableCell>
                          <TableCell style={{ color: "#4D475B" }}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" style={{ color: "#94909C" }} />
                              <span className="font-mono text-sm">{click["X-Forwarded-For"] || "Unknown"}</span>
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
      </div>
    </div>
  )
}
