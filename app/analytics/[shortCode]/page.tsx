"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  ExternalLink,
  Calendar,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  MapPin,
  TrendingUp,
  Eye,
  MousePointer,
  Share2,
} from "lucide-react"
import { useRealTimeAnalytics } from "@/hooks/use-real-time-analytics"
import Link from "next/link"

interface AnalyticsData {
  shortCode: string
  originalUrl: string
  totalClicks: number
  createdAt: string
  clickHistory: Array<{
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

export default function AnalyticsPage() {
  const params = useParams()
  const shortCode = params.shortCode as string
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use real-time analytics hook
  const realTimeData = useRealTimeAnalytics(shortCode)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/analytics/${shortCode}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Short URL not found")
          }
          throw new Error("Failed to fetch analytics")
        }

        const data = await response.json()
        setAnalytics(data)
      } catch (err) {
        console.error("Error fetching analytics:", err)
        setError(err instanceof Error ? err.message : "Failed to load analytics")
      } finally {
        setIsLoading(false)
      }
    }

    if (shortCode) {
      fetchAnalytics()
    }
  }, [shortCode])

  // Update analytics with real-time data
  useEffect(() => {
    if (realTimeData && analytics) {
      setAnalytics((prev) =>
        prev
          ? {
              ...prev,
              totalClicks: realTimeData.totalClicks,
              clickHistory: realTimeData.clickHistory || prev.clickHistory,
            }
          : null,
      )
    }
  }, [realTimeData, analytics])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading real-time analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Not Available</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 bg-transparent"
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Found</h2>
              <p className="text-gray-600 mb-4">No analytics data available for this short URL.</p>
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 bg-transparent"
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Process analytics data
  const recentClicks = analytics.clickHistory.slice(-10).reverse()
  const clicksByDay = analytics.clickHistory.reduce(
    (acc, click) => {
      const date = new Date(click.timestamp).toDateString()
      acc[date] = (acc[date] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const deviceStats = analytics.clickHistory.reduce(
    (acc, click) => {
      const device = click.device || "Unknown"
      acc[device] = (acc[device] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const browserStats = analytics.clickHistory.reduce(
    (acc, click) => {
      const browser = click.browser || "Unknown"
      acc[browser] = (acc[browser] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const countryStats = analytics.clickHistory.reduce(
    (acc, click) => {
      const country = click.country || "Unknown"
      acc[country] = (acc[country] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-pink-500 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <p className="text-purple-100">Real-time insights for your short URL</p>
              </div>
            </div>
            <Link href="/">
              <Button
                variant="outline"
                className="border-purple-300 text-purple-100 hover:bg-purple-700 hover:border-purple-200 bg-transparent"
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* URL Info Card */}
        <Card className="mb-8 border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900">Short URL Details</CardTitle>
                <CardDescription className="text-gray-600">Information about your shortened link</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {analytics.totalClicks} {analytics.totalClicks === 1 ? "click" : "clicks"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-gray-900">Short URL:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-800">
                  {window.location.origin}/{analytics.shortCode}
                </code>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-gray-900">Original URL:</span>
                <a
                  href={analytics.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-800 underline break-all"
                >
                  {analytics.originalUrl}
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-gray-900">Created:</span>
                <span className="text-gray-600">
                  {new Date(analytics.createdAt).toLocaleDateString()} at{" "}
                  {new Date(analytics.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MousePointer className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalClicks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-pink-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unique Days</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(clicksByDay).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Countries</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(countryStats).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Monitor className="h-6 w-6 text-pink-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Devices</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(deviceStats).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Device Stats */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Smartphone className="h-5 w-5 mr-2 text-purple-600" />
                Device Types
              </CardTitle>
              <CardDescription className="text-gray-600">Breakdown of devices used to access your link</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(deviceStats).map(([device, count]) => (
                  <div key={device} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{device}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(count / analytics.totalClicks) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Browser Stats */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Monitor className="h-5 w-5 mr-2 text-purple-600" />
                Browsers
              </CardTitle>
              <CardDescription className="text-gray-600">Browsers used to access your link</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(browserStats).map(([browser, count]) => (
                  <div key={browser} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{browser}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-pink-600 h-2 rounded-full"
                          style={{ width: `${(count / analytics.totalClicks) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Geographic Data */}
        <Card className="mb-8 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <MapPin className="h-5 w-5 mr-2 text-purple-600" />
              Geographic Distribution
            </CardTitle>
            <CardDescription className="text-gray-600">Countries where your link was accessed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(countryStats).map(([country, count]) => (
                <div key={country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{country}</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {count} {count === 1 ? "click" : "clicks"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Clock className="h-5 w-5 mr-2 text-purple-600" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-gray-600">Latest clicks on your short URL</CardDescription>
          </CardHeader>
          <CardContent>
            {recentClicks.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentClicks.map((click, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MousePointer className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {click.country || "Unknown"} • {click.device || "Unknown Device"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {click.browser || "Unknown Browser"} • {click.os || "Unknown OS"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{new Date(click.timestamp).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{new Date(click.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share Section */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Share2 className="h-5 w-5 mr-2 text-purple-600" />
              Share Analytics
            </CardTitle>
            <CardDescription className="text-gray-600">Share this analytics page with others</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm text-gray-800">{window.location.href}</code>
              <Button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
