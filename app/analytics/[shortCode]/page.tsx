"use client"

import React from "react"

import { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Globe,
  Loader2,
  Zap,
  Target,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Monitor,
  Smartphone,
  MapPin,
  User,
  LinkIcon,
} from "lucide-react"
import Link from "next/link"
import { useRealTimeAnalytics } from "@/hooks/use-real-time-analytics"
import { useClickHistory } from "@/hooks/use-click-history"
import { RealTimeClickTracker } from "@/lib/real-time-tracker"

export default function AnalyticsPage({
  params,
}: {
  params: { shortCode: string }
}) {
  const { shortCode } = params
  const { urlData, analyticsData, loading, error, connectionStatus, clickCount, isNewClick, lastUpdate } =
    useRealTimeAnalytics(shortCode)

  const { clickHistory, loading: historyLoading } = useClickHistory(shortCode, 100)

  const trackerRef = useRef<RealTimeClickTracker | null>(null)

  // Initialize tracker for analytics page interactions
  React.useEffect(() => {
    trackerRef.current = new RealTimeClickTracker(shortCode)
    return () => {
      if (trackerRef.current) {
        trackerRef.current.destroy()
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

  if (loading) {
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
                      ? "🔥 Real-time WebSocket connected - Clicks update instantly!"
                      : connectionStatus === "connecting"
                        ? "Connecting to Firestore WebSocket..."
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
                  Updates instantly via Firestore WebSocket when short URL is clicked
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
                      Real-time update via Firestore WebSocket - No refresh needed!
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

          {/* Click History Section */}
          <Card className="mb-8 shadow-sm" style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: "#4D475B" }}>
                <Clock className="h-5 w-5" style={{ color: "#833ADF" }} />
                Detailed Click History
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
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {clickHistory.map((click, index) => (
                    <div
                      key={click.id || index}
                      className={`p-4 rounded-lg border transition-all duration-300 ${
                        index === 0 && isNewClick ? "shadow-md" : ""
                      }`}
                      style={{
                        backgroundColor:
                          index === 0 && isNewClick
                            ? "rgba(242, 44, 124, 0.05)"
                            : click.clickSource === "analytics_page"
                              ? "rgba(217, 216, 253, 0.3)"
                              : "rgba(217, 216, 253, 0.1)",
                        borderColor: index === 0 && isNewClick ? "#F22C7C" : "#D9D8FD",
                      }}
                      onClick={handleElementClick(`click-history-${index}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Timestamp and Status */}
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4" style={{ color: "#94909C" }} />
                            <span className="text-sm font-medium" style={{ color: "#4D475B" }}>
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
                                LIVE!
                              </span>
                            )}
                            {click.clickSource === "analytics_page" && (
                              <span
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  color: "#833ADF",
                                  backgroundColor: "rgba(131, 58, 223, 0.1)",
                                }}
                              >
                                Analytics
                              </span>
                            )}
                            {click.clickSource === "direct" && (
                              <span
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  color: "#F22C7C",
                                  backgroundColor: "rgba(242, 44, 124, 0.1)",
                                }}
                              >
                                URL Click
                              </span>
                            )}
                          </div>

                          {/* Device and Browser Info */}
                          <div className="flex items-center gap-4 mb-2 text-xs" style={{ color: "#94909C" }}>
                            <div className="flex items-center gap-1">
                              {getDeviceIcon(click.userAgent)}
                              <span>{formatUserAgent(click.userAgent)}</span>
                            </div>
                            {click.referer && (
                              <div className="flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" style={{ color: "#94909C" }} />
                                <span>From: {formatReferrer(click.referer)}</span>
                              </div>
                            )}
                          </div>

                          {/* Additional Details */}
                          <div className="grid grid-cols-2 gap-4 text-xs" style={{ color: "#94909C" }}>
                            {click.ip && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" style={{ color: "#94909C" }} />
                                <span>IP: {click.ip}</span>
                              </div>
                            )}
                            {click.sessionId && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" style={{ color: "#94909C" }} />
                                <span>Session: {click.sessionId.substring(0, 8)}...</span>
                              </div>
                            )}
                          </div>

                          {/* Device Details if available */}
                          {click.device && (
                            <div className="mt-2 text-xs">
                              <span
                                className="px-2 py-1 rounded mr-2"
                                style={{
                                  backgroundColor: "rgba(131, 58, 223, 0.1)",
                                  color: "#833ADF",
                                }}
                              >
                                {click.device.os || "Unknown OS"}
                              </span>
                              <span
                                className="px-2 py-1 rounded mr-2"
                                style={{
                                  backgroundColor: "rgba(131, 58, 223, 0.1)",
                                  color: "#833ADF",
                                }}
                              >
                                {click.device.browser || "Unknown Browser"}
                              </span>
                              {click.device.isMobile && (
                                <span
                                  className="px-2 py-1 rounded text-xs"
                                  style={{
                                    backgroundColor: "rgba(242, 44, 124, 0.1)",
                                    color: "#F22C7C",
                                  }}
                                >
                                  Mobile
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Real-time Tracking */}
          <Card className="mt-6 shadow-sm" style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
            <CardHeader>
              <CardTitle style={{ color: "#4D475B" }}>Test Real-time WebSocket Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={(e) => {
                    handleElementClick("test-button-1")(e)
                    if (trackerRef.current) {
                      trackerRef.current.trackClick("test", { testType: "button-1" })
                    }
                  }}
                  variant="outline"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#D9D8FD",
                    color: "#833ADF",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(131, 58, 223, 0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                >
                  Test Click 1
                </Button>
                <Button
                  onClick={(e) => {
                    handleElementClick("test-button-2")(e)
                    if (trackerRef.current) {
                      trackerRef.current.trackClick("test", { testType: "button-2" })
                    }
                  }}
                  variant="outline"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#D9D8FD",
                    color: "#833ADF",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(131, 58, 223, 0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                >
                  Test Click 2
                </Button>
                <Button
                  onClick={(e) => {
                    handleElementClick("simulate-multiple")(e)
                    // Simulate multiple clicks
                    if (trackerRef.current) {
                      for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                          trackerRef.current?.trackClick("test", { testType: "multiple", index: i })
                        }, i * 500)
                      }
                    }
                  }}
                  variant="outline"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#D9D8FD",
                    color: "#833ADF",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(131, 58, 223, 0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                >
                  Simulate Multiple Clicks
                </Button>
              </div>
              <div
                className="mt-4 p-3 rounded-lg border"
                style={{
                  backgroundColor: "rgba(217, 216, 253, 0.3)",
                  borderColor: "#D9D8FD",
                }}
              >
                <p className="text-sm font-medium" style={{ color: "#833ADF" }}>
                  💡 How to test real-time updates:
                </p>
                <ul className="text-xs mt-2 space-y-1" style={{ color: "#833ADF" }}>
                  <li>1. Open your short URL in a new tab/window</li>
                  <li>2. Watch this page update instantly when you click the link</li>
                  <li>3. No refresh needed - powered by Firestore WebSocket!</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
