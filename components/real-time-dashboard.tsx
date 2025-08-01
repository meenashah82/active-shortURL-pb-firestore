"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, BarChart3, TrendingUp } from 'lucide-react'
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
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    console.log("🔄 Setting up real-time dashboard subscription")

    const unsubscribe = subscribeToTopUrls((urls) => {
      console.log(`📊 Received ${urls.length} top URLs`)
      setTopUrls(urls)
      setLoading(false)
    })

    return () => {
      console.log("🧹 Cleaning up real-time dashboard subscription")
      unsubscribe()
    }
  }, [])

  const copyToClipboard = async (url: string) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement("textarea")
      textArea.value = url

      // Make it invisible but still selectable
      textArea.style.position = "absolute"
      textArea.style.left = "-9999px"
      textArea.style.top = "-9999px"
      textArea.style.opacity = "0"
      textArea.style.pointerEvents = "none"
      textArea.setAttribute("readonly", "")
      textArea.setAttribute("contenteditable", "true")

      // Add to DOM
      document.body.appendChild(textArea)

      // Select and copy
      textArea.select()
      textArea.setSelectionRange(0, 99999) // For mobile devices

      // Try to copy using execCommand
      const successful = document.execCommand("copy")

      // Remove from DOM
      document.body.removeChild(textArea)

      if (successful) {
        toast({
          title: "Copied!",
          description: "URL copied to clipboard.",
        })
      } else {
        throw new Error("Copy command failed")
      }
    } catch (error) {
      console.error("Copy failed:", error)

      // Final fallback - show the URL in a prompt for manual copying
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)

      if (isMobile) {
        // On mobile, try to select the text in a temporary input
        const input = document.createElement("input")
        input.value = url
        input.style.position = "absolute"
        input.style.left = "-9999px"
        document.body.appendChild(input)
        input.select()
        input.setSelectionRange(0, 99999)

        toast({
          title: "Copy manually",
          description: "Please manually copy the selected text.",
          duration: 5000,
        })

        setTimeout(() => {
          document.body.removeChild(input)
        }, 5000)
      } else {
        // On desktop, show in a prompt
        prompt("Copy this URL manually:", url)
      }
    }
  }

  const openUrl = (shortCode: string) => {
    const shortUrl = `${window.location.origin}/${shortCode}`
    window.open(shortUrl, "_blank")
  }

  const openAnalytics = (shortCode: string) => {
    router.push(`/analytics/${shortCode}`)
  }

  if (loading) {
    return (
      <Card className="w-full border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Top Performing URLs
          </CardTitle>
          <CardDescription className="text-gray-600">Loading real-time analytics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (topUrls.length === 0) {
    return (
      <Card className="w-full border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Top Performing URLs
          </CardTitle>
          <CardDescription className="text-gray-600">Real-time click analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No URLs with clicks yet. Start sharing your short URLs!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Top Performing URLs
        </CardTitle>
        <CardDescription className="text-gray-600">
          Real-time click analytics • {topUrls.reduce((sum, url) => sum + url.clicks, 0)} total clicks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topUrls.map((urlData, index) => {
            const shortUrl = `${window.location.origin}/${urlData.shortCode}`
            return (
              <div
                key={urlData.shortCode}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className="border-purple-300 text-purple-600 font-semibold">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 truncate">{shortUrl}</h3>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-semibold">
                          {urlData.clicks} clicks
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate" title={urlData.originalUrl}>
                        {urlData.originalUrl}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(shortUrl)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openUrl(urlData.shortCode)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAnalytics(urlData.shortCode)}
                      className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
