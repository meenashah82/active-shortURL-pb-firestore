"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ExternalLink, Globe, Calendar, Clock, Smartphone, Monitor, Tablet } from "lucide-react"
import Link from "next/link"
import { useRealTimeAnalytics } from "@/hooks/use-real-time-analytics"

interface AnalyticsData {
  shortCode: string
  originalUrl: string
  totalClicks: number
  createdAt: string
  lastClickAt?: string
  clicksByDay: { [key: string]: number }
  recentClicks: Array<{
    id: string
    timestamp: string
    userAgent: string
    referer: string
    ip: string
    country?: string
    city?: string
    device?: string
    browser?: string
    os?: string
  }>
}

export default function AnalyticsPage({ params }: { params: { shortCode: string } }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [interactions, setInteractions] = useState<Array<{ action: string; timestamp: string }>>([])
  const [testClicks, setTestClicks] = useState(0)

  // Use real-time analytics hook
  const {
    urlData,
    analyticsData,
    loading: rtLoading,
    error: rtError,
    connectionStatus,
    clickCount,
    isNewClick,
    lastUpdate,
  } = useRealTimeAnalytics(params.shortCode)

  useEffect(() => {
    fetchAnalytics()
  }, [params.shortCode])

  // Update analytics when real-time data changes
  useEffect(() => {
    if (urlData && analyticsData) {
      const combinedData: AnalyticsData = {
        shortCode: params.shortCode,
        originalUrl: urlData.originalUrl,
        totalClicks: clickCount,
        createdAt: urlData.createdAt,
        lastClickAt: analyticsData.lastClickAt,
        clicksByDay: {},
        recentClicks:
          analyticsData.clickEvents?.slice(-10).map((event, index) => ({
            id: event.id || `event-${index}`,
            timestamp: event.timestamp,
            userAgent: event.userAgent || "Unknown",
            referer: event.referer || "Direct",
            ip: event.ip || "",
            country: "",
            city: "",
            device: "",
            browser: "",
            os: "",
          })) || [],
      }
      setAnalytics(combinedData)
      setLoading(false)
    }
  }, [urlData, analyticsData, clickCount, params.shortCode])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/${params.shortCode}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`)
      }

      const data = await response.json()

      // Transform the API response to match our interface
      const transformedAnalytics: AnalyticsData = {
        shortCode: params.shortCode,
        originalUrl: data.urlData?.originalUrl || "",
        totalClicks: data.urlData?.clicks || 0,
        createdAt: data.urlData?.createdAt || new Date().toISOString(),
        lastClickAt: data.analyticsData?.lastClickAt,
        clicksByDay: {},
        recentClicks:
          data.analyticsData?.clickEvents?.slice(-10).map((event: any, index: number) => ({
            id: event.id || `event-${index}`,
            timestamp: event.timestamp,
            userAgent: event.userAgent || "Unknown",
            referer: event.referer || "Direct",
            ip: event.ip || "",
            country: "",
            city: "",
            device: "",
            browser: "",
            os: "",
          })) || [],
      }

      setAnalytics(transformedAnalytics)

      // Add interaction
      addInteraction("Loaded analytics page")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  const addInteraction = (action: string) => {
    const newInteraction = {
      action,
      timestamp: new Date().toLocaleTimeString(),
    }
    setInteractions((prev) => [newInteraction, ...prev.slice(0, 9)]) // Keep last 10
  }

  const handleTestClick = () => {
    setTestClicks((prev) => prev + 1)
    addInteraction(`Test button clicked (${testClicks + 1})`)
  }

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-4 w-4" />
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  if (loading || rtLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-source-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-violet mx-auto mb-4"></div>
          <p className="text-secondary-gray body-text">Loading real-time analytics...</p>
        </div>
      </div>
    )
  }

  if (error || rtError || !analytics) {
    return (
      <div className="min-h-screen bg-white font-source-sans">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-light-purple text-tundora hover:bg-light-purple bg-transparent links-semi-bold"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>

            <Card className="border-light-purple">
              <CardHeader>
                <CardTitle className="text-tundora flex items-center gap-2 title-semi-bold">
                  <Globe className="h-5 w-5" />
                  Error Loading Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary-gray mb-4 body-text">
                  {error || rtError || "Analytics data not found for this short code."}
                </p>
                <Button
                  onClick={fetchAnalytics}
                  className="bg-electric-violet hover:bg-electric-violet/90 text-white links-semi-bold"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const isConnected = connectionStatus === "connected"

  return (
    <div className="min-h-screen bg-white font-source-sans">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-light-purple text-tundora hover:bg-light-purple bg-transparent links-semi-bold"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="section-title-h3 text-tundora">Real-Time Analytics Dashboard</h1>
                <p className="text-secondary-gray mt-1 body-text">
                  Short code: <code className="bg-light-gray px-2 py-1 rounded text-sm">{params.shortCode}</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className={isConnected ? "bg-electric-violet text-white" : "bg-light-gray text-secondary-gray"}
              >
                {isConnected ? "🟢 Live" : "🔴 Disconnected"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Analytics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Total Clicks Card */}
              <Card className="border-light-purple">
                <CardHeader>
                  <CardTitle className="text-tundora flex items-center gap-2 title-semi-bold">
                    <Globe className="h-5 w-5" />
                    Total Clicks (Real-time)
                  </CardTitle>
                  <CardDescription className="text-secondary-gray body-text">
                    Live click tracking with WebSocket updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold text-electric-violet mb-2 ${isNewClick ? "animate-pulse" : ""}`}>
                    {analytics.totalClicks.toLocaleString()}
                  </div>
                  <p className="text-sm text-secondary-gray">
                    {analytics.lastClickAt
                      ? `Last click: ${new Date(analytics.lastClickAt).toLocaleString()}`
                      : "No clicks yet"}
                  </p>
                </CardContent>
              </Card>

              {/* URL Information */}
              <Card className="border-light-purple">
                <CardHeader>
                  <CardTitle className="text-tundora flex items-center gap-2 title-semi-bold">
                    <ExternalLink className="h-5 w-5" />
                    URL Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-tundora">Short URL</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-light-gray px-3 py-2 rounded flex-1 text-sm text-tundora">
                        {typeof window !== "undefined"
                          ? `${window.location.origin}/${params.shortCode}`
                          : `/${params.shortCode}`}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          typeof window !== "undefined" &&
                          navigator.clipboard.writeText(`${window.location.origin}/${params.shortCode}`)
                        }
                        className="border-light-purple text-tundora hover:bg-light-purple"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-tundora">Original URL</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-light-gray px-3 py-2 rounded flex-1 text-sm text-tundora break-all">
                        {analytics.originalUrl}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(analytics.originalUrl, "_blank")}
                        className="border-light-purple text-tundora hover:bg-light-purple"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-tundora">Created</label>
                    <p className="text-sm text-secondary-gray mt-1">{new Date(analytics.createdAt).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Clicks */}
              <Card className="border-light-purple">
                <CardHeader>
                  <CardTitle className="text-tundora flex items-center gap-2 title-semi-bold">
                    <Clock className="h-5 w-5" />
                    Recent Clicks (Live WebSocket Feed)
                  </CardTitle>
                  <CardDescription className="text-secondary-gray body-text">
                    Real-time click events as they happen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.recentClicks && analytics.recentClicks.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {analytics.recentClicks.slice(0, 10).map((click, index) => (
                        <div key={click.id || index} className="flex items-start gap-3 p-3 bg-light-gray rounded-lg">
                          <div className="flex-shrink-0 mt-1">{getDeviceIcon(click.userAgent)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-tundora">
                                {new Date(click.timestamp).toLocaleTimeString()}
                              </span>
                              {click.country && (
                                <Badge variant="secondary" className="bg-light-purple text-electric-violet text-xs">
                                  {click.country}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-secondary-gray truncate">{click.userAgent}</p>
                            {click.referer && click.referer !== "Direct" && (
                              <p className="text-xs text-secondary-gray truncate mt-1">From: {click.referer}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary-gray text-center py-8 body-text">No clicks recorded yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Analytics Page Interactions */}
              <Card className="border-light-purple">
                <CardHeader>
                  <CardTitle className="text-tundora sub-headings-semi-bold">Analytics Page Interactions</CardTitle>
                  <CardDescription className="text-secondary-gray body-text">
                    Track your interactions with this page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {interactions.length > 0 ? (
                      interactions.map((interaction, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-tundora">{interaction.action}</span>
                          <span className="text-secondary-gray">{interaction.timestamp}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-secondary-gray text-sm">No interactions yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Test Real-time Updates */}
              <Card className="border-light-purple">
                <CardHeader>
                  <CardTitle className="text-tundora sub-headings-semi-bold">
                    Test Real-time WebSocket Updates
                  </CardTitle>
                  <CardDescription className="text-secondary-gray body-text">
                    Test the real-time functionality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-electric-violet mb-2">{testClicks}</div>
                    <p className="text-sm text-secondary-gray mb-4">Test button clicks</p>
                    <Button
                      onClick={handleTestClick}
                      className="w-full bg-violet-pink hover:bg-violet-pink/90 text-white links-semi-bold"
                    >
                      Test Click
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-tundora">WebSocket Status:</span>
                      <Badge
                        variant={isConnected ? "default" : "secondary"}
                        className={isConnected ? "bg-electric-violet text-white" : "bg-light-gray text-secondary-gray"}
                      >
                        {isConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-tundora">Page Loaded:</span>
                      <span className="text-secondary-gray">{new Date().toLocaleTimeString()}</span>
                    </div>
                    {lastUpdate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-tundora">Last Update:</span>
                        <span className="text-secondary-gray">{lastUpdate.toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Clicks by Day */}
              {analytics.clicksByDay && Object.keys(analytics.clicksByDay).length > 0 && (
                <Card className="border-light-purple">
                  <CardHeader>
                    <CardTitle className="text-tundora sub-headings-semi-bold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Clicks by Day
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analytics.clicksByDay)
                        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                        .slice(0, 7)
                        .map(([date, clicks]) => (
                          <div key={date} className="flex justify-between items-center">
                            <span className="text-sm text-tundora">{new Date(date).toLocaleDateString()}</span>
                            <Badge variant="secondary" className="bg-light-purple text-electric-violet">
                              {clicks}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
