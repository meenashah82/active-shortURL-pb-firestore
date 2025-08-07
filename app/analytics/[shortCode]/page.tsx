"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Copy, Calendar, MousePointer, Globe, Clock } from 'lucide-react'
import Link from "next/link"
import { useRealTimeAnalytics } from "@/hooks/use-real-time-analytics"
import { useClickHistory } from "@/hooks/use-click-history"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

export default function AnalyticsPage() {
  const params = useParams()
  const shortCode = params.shortCode as string
  const { toast } = useToast()

  const {
    data: analytics,
    loading: analyticsLoading,
    error: analyticsError,
    animateClicks
  } = useRealTimeAnalytics(shortCode)

  const {
    clicks,
    loading: clicksLoading,
    error: clicksError
  } = useClickHistory(shortCode)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "URL copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  if (analyticsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (analyticsError || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">Error loading analytics: {analyticsError}</p>
              <p className="text-gray-600">The short URL "{shortCode}" was not found or there was an error loading the data.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const shortUrl = `${window.location.origin}/${shortCode}`

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Detailed analytics for your shortened URL</p>
        </div>

        {/* URL Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              URL Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Short URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1">{shortUrl}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(shortUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(shortUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Original URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1 truncate">{analytics.originalUrl}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(analytics.originalUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(analytics.originalUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {new Date(analytics.createdAt).toLocaleDateString()} at {new Date(analytics.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Clicks</p>
                  <p className={`text-3xl font-bold transition-all duration-300 ${
                    animateClicks ? 'text-green-600 scale-110' : 'text-gray-900'
                  }`}>
                    {analytics.totalClicks}
                  </p>
                </div>
                <MousePointer className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Unique Visitors</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.uniqueVisitors || 0}</p>
                </div>
                <Globe className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Clicked</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {analytics.lastClickedAt 
                      ? formatDistanceToNow(new Date(analytics.lastClickedAt), { addSuffix: true })
                      : 'Never'
                    }
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Click History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Recent Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clicksLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading click history...</p>
              </div>
            ) : clicksError ? (
              <div className="text-center py-8">
                <p className="text-red-600">Error loading click history: {clicksError}</p>
              </div>
            ) : clicks.length === 0 ? (
              <div className="text-center py-8">
                <MousePointer className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No clicks yet</p>
                <p className="text-sm text-gray-400">Share your short URL to start tracking clicks!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clicks.map((click, index) => (
                  <div key={click.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{clicks.length - index}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Click from {click.userAgent ? click.userAgent.split(' ')[0] : 'Unknown Browser'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(click.timestamp).toLocaleDateString()} at {new Date(click.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{click.ipAddress || 'Unknown IP'}</p>
                      <p className="text-xs text-gray-500">{click.referrer || 'Direct'}</p>
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
