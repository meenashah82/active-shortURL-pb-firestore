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
    if (!userAgent) return <Monitor className="h-4 w-4" />

    if (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone")) {
      return <Smartphone className="h-4 w-4" />
    }

    return <Monitor className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="text-gray-800 font-medium">Loading real-time analytics...</span>
        </div>
      </div>
    )
  }

  if (error || !urlData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-white border-purple-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-800">Error Loading Analytics</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error || "Failed to load analytics data"}</p>
            <Link href="/">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const shortUrl = `${window.location.origin}/${shortCode}`

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Real-time Connection Status */}
          <Card
            className={`mb-6 border-l-4 bg-white shadow-sm ${
              connectionStatus === "connected"
                ? "border-l-green-500"
                : connectionStatus === "connecting"
                  ? "border-l-yellow-500"
                  : "border-l-red-500"
            }`}
          >
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {connectionStatus === "connected" ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : connectionStatus === "connecting" ? (
                    <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                  )}

                  <span
                    className={`text-sm font-medium ${
                      connectionStatus === "connected"
                        ? "text-green-700"
                        : connectionStatus === "connecting"
                          ? "text-yellow-700"
                          : "text-red-700"
                    }`}
                  >
                    {connectionStatus === "connected"
                      ? "🔥 Real-time WebSocket connected - Clicks update instantly!"
                      : connectionStatus === "connecting"
                        ? "Connecting to Firestore WebSocket..."
                        : "Connection lost - Attempting to reconnect..."}
                  </span>

                  {connectionStatus === "connected" && <Activity className="h-4 w-4 text-green-600 animate-pulse" />}
                </div>

                <div className="text-xs text-gray-500">
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
                className="border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Real-Time Analytics Dashboard</h1>
          </div>

          {/* Real-time Click Counter */}
          <Card
            className={`mb-8 transition-all duration-500 bg-white shadow-sm ${
              isNewClick
                ? "border-4 border-pink-400 shadow-lg shadow-pink-200 scale-[1.02]"
                : "border-2 border-purple-200"
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Zap
                  className={`h-6 w-6 transition-all duration-300 ${
                    isNewClick ? "text-pink-500 animate-bounce scale-125" : "text-purple-600"
                  }`}
                />
                Total Clicks (Real-time)
                {isNewClick && (
                  <div className="flex items-center gap-1 text-pink-600 animate-pulse">
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
                    isNewClick ? "text-pink-600 scale-110 drop-shadow-lg animate-pulse" : "text-purple-600"
                  }`}
                >
                  {clickCount}
                </div>
                <p className="text-gray-600 mt-2 text-lg">
                  Updates instantly via Firestore WebSocket when short URL is clicked
                </p>
                {isNewClick && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-2 border-pink-300">
                    <div className="text-pink-700 font-bold text-xl animate-bounce">
                      🎉 Someone just clicked your short URL!
                    </div>
                    <div className="text-pink-600 text-sm mt-2">
                      Real-time update via Firestore WebSocket - No refresh needed!
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* URL Info */}
          <Card className="mb-8 bg-white border-purple-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Globe className="h-5 w-5 text-purple-600" />
                URL Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Short URL:</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-purple-50 rounded text-sm text-gray-800 border border-purple-100">
                    {shortUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      handleElementClick("open-short-url")(e)
                      window.open(shortUrl, "_blank")
                    }}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Click this link to test real-time analytics updates!</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Original URL:</label>
                <p className="text-sm text-gray-600 mt-1 break-all">{urlData.originalUrl}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {urlData.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Click History Section */}
          <Card className="mb-8 bg-white border-purple-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Clock className="h-5 w-5 text-purple-600" />
                Detailed Click History
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2 text-purple-600" />
                  <span className="text-gray-700">Loading click history...</span>
                </div>
              ) : clickHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-2">No clicks recorded yet</p>
                  <p className="text-xs text-gray-400">
                    Share your short URL to see detailed click analytics appear here!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {clickHistory.map((click, index) => (
                    <div
                      key={click.id || index}
                      className={`p-4 rounded-lg border transition-all duration-300 ${
                        index === 0 && isNewClick
                          ? "bg-gradient-to-r from-pink-50 to-purple-50 border-pink-300 shadow-md"
                          : click.clickSource === "analytics_page"
                            ? "bg-purple-50 border-purple-200"
                            : "bg-gray-50 border-gray-200"
                      }`}
                      onClick={handleElementClick(`click-history-${index}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Timestamp and Status */}
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-800">
                              {click.timestamp?.toDate?.()?.toLocaleString() || "Just now"}
                            </span>
                            {index === 0 && isNewClick && (
                              <span className="text-pink-600 text-xs font-bold animate-bounce bg-pink-100 px-2 py-1 rounded">
                                LIVE!
                              </span>
                            )}
                            {click.clickSource === "analytics_page" && (
                              <span className="text-purple-600 text-xs bg-purple-100 px-2 py-1 rounded">Analytics</span>
                            )}
                            {click.clickSource === "direct" && (
                              <span className="text-pink-600 text-xs bg-pink-100 px-2 py-1 rounded">URL Click</span>
                            )}
                          </div>

                          {/* Device and Browser Info */}
                          <div className="flex items-center gap-4 mb-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              {getDeviceIcon(click.userAgent)}
                              <span>{formatUserAgent(click.userAgent)}</span>
                            </div>
                            {click.referer && (
                              <div className="flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                <span>From: {formatReferrer(click.referer)}</span>
                              </div>
                            )}
                          </div>

                          {/* Additional Details */}
                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                            {click.ip && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>IP: {click.ip}</span>
                              </div>
                            )}
                            {click.sessionId && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>Session: {click.sessionId.substring(0, 8)}...</span>
                              </div>
                            )}
                          </div>

                          {/* Device Details if available */}
                          {click.device && (
                            <div className="mt-2 text-xs text-gray-500">
                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded mr-2">
                                {click.device.os || "Unknown OS"}
                              </span>
                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded mr-2">
                                {click.device.browser || "Unknown Browser"}
                              </span>
                              {click.device.isMobile && (
                                <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">Mobile</span>
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
          <Card className="mt-6 bg-white border-purple-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-800">Test Real-time WebSocket Updates</CardTitle>
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
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
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
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
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
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  Simulate Multiple Clicks
                </Button>
              </div>
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-800 font-medium">💡 How to test real-time updates:</p>
                <ul className="text-xs text-purple-700 mt-2 space-y-1">
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
