"use client"

import { use, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRealTimeAnalytics } from "@/hooks/use-real-time-analytics"
import { useClickHistory } from "@/hooks/use-click-history"
import { getUrlData, type UrlData } from "@/lib/analytics-clean"
import { Eye, ExternalLink, Copy, Clock, Smartphone, Monitor, Activity, TrendingUp, MousePointer } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PageProps {
  params: Promise<{ shortCode: string }>
}

export default function AnalyticsPage({ params }: PageProps) {
  const { shortCode } = use(params)
  const [urlData, setUrlData] = useState<UrlData | null>(null)
  const [loading, setLoading] = useState(true)
  const [testUrl, setTestUrl] = useState("")

  const { analytics, isConnected, connectionStatus } = useRealTimeAnalytics(shortCode)
  const { clickHistory, loading: historyLoading } = useClickHistory(shortCode, 100)

  useEffect(() => {
    async function fetchUrlData() {
      try {
        const data = await getUrlData(shortCode)
        setUrlData(data)
        setTestUrl(`https://wodify.link/${shortCode}`)
      } catch (error) {
        console.error("Error fetching URL data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUrlData()
  }, [shortCode])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      })
    }
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Unknown"

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(date)
    } catch (error) {
      return "Invalid date"
    }
  }

  const getDeviceIcon = (device?: { isMobile?: boolean; type?: string }) => {
    if (device?.isMobile || device?.type === "mobile") {
      return <Smartphone className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  const getClickSourceBadge = (source?: string) => {
    switch (source) {
      case "direct":
        return (
          <Badge variant="default" className="bg-orange-600 hover:bg-orange-700">
            Direct
          </Badge>
        )
      case "analytics_page":
        return (
          <Badge variant="secondary" className="bg-gray-700 hover:bg-gray-600">
            Analytics
          </Badge>
        )
      case "test":
        return (
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            Test
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            Unknown
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading real-time analytics...</p>
        </div>
      </div>
    )
  }

  if (!urlData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">URL Not Found</CardTitle>
            <CardDescription className="text-gray-400">
              The short URL "{shortCode}" does not exist or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-100">Analytics Dashboard</h1>
          <p className="text-gray-400">Real-time analytics for your short URL</p>
        </div>

        {/* Connection Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="text-sm font-medium text-gray-300">{isConnected ? "Connected" : "Disconnected"}</span>
              </div>
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {connectionStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* URL Information */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center space-x-2">
              <ExternalLink className="h-5 w-5" />
              <span>URL Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Short URL</label>
              <div className="flex space-x-2 mt-1">
                <Input
                  value={`https://wodify.link/${shortCode}`}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
                <Button
                  onClick={() => copyToClipboard(`https://wodify.link/${shortCode}`)}
                  variant="outline"
                  size="icon"
                  className="border-gray-600 hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Original URL</label>
              <div className="flex space-x-2 mt-1">
                <Input value={urlData.originalUrl} readOnly className="bg-gray-700 border-gray-600 text-gray-100" />
                <Button
                  onClick={() => copyToClipboard(urlData.originalUrl)}
                  variant="outline"
                  size="icon"
                  className="border-gray-600 hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Created</label>
              <p className="text-gray-400 mt-1">{formatTimestamp(urlData.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">{analytics?.totalClicks || 0}</div>
              <p className="text-xs text-gray-400">
                {isConnected && (
                  <span className="inline-flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-1 animate-pulse"></div>
                    Live updates
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Last Click</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">
                {analytics?.lastClickAt ? formatTimestamp(analytics.lastClickAt) : "Never"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Click History</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">{clickHistory.length}</div>
              <p className="text-xs text-gray-400">Recent records</p>
            </CardContent>
          </Card>
        </div>

        {/* Test Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Test Your Short URL</CardTitle>
            <CardDescription className="text-gray-400">
              Click the button below to test your short URL and see real-time analytics updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input value={testUrl} readOnly className="bg-gray-700 border-gray-600 text-gray-100" />
              <Button onClick={() => window.open(testUrl, "_blank")} className="bg-orange-600 hover:bg-orange-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Test Click
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Click History */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Click History</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Detailed history of all clicks on your short URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
                <p className="text-gray-400">Loading click history...</p>
              </div>
            ) : clickHistory.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No clicks recorded yet</p>
                <p className="text-sm text-gray-500 mt-2">Share your short URL to start seeing analytics data here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clickHistory.map((click, index) => (
                  <div
                    key={click.id || index}
                    className="border border-gray-700 rounded-lg p-4 bg-gray-750 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getDeviceIcon(click.device)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-200">
                              {formatTimestamp(click.timestamp)}
                            </span>
                            {getClickSourceBadge(click.clickSource)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {click.device && (
                              <div>
                                <span className="text-gray-400">Device:</span>
                                <span className="text-gray-300 ml-2">
                                  {click.device.browser || "Unknown"} on {click.device.os || "Unknown"}
                                  {click.device.isMobile ? " (Mobile)" : " (Desktop)"}
                                </span>
                              </div>
                            )}

                            {click.referer && (
                              <div>
                                <span className="text-gray-400">Referrer:</span>
                                <span className="text-gray-300 ml-2 truncate">{click.referer}</span>
                              </div>
                            )}

                            {click.ip && (
                              <div>
                                <span className="text-gray-400">IP:</span>
                                <span className="text-gray-300 ml-2">{click.ip}</span>
                              </div>
                            )}

                            {click.sessionId && (
                              <div>
                                <span className="text-gray-400">Session:</span>
                                <span className="text-gray-300 ml-2 font-mono text-xs">
                                  {click.sessionId.substring(0, 12)}...
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {index === 0 && isConnected && (
                        <Badge variant="outline" className="border-orange-500 text-orange-500">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-1 animate-pulse"></div>
                          Latest
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
