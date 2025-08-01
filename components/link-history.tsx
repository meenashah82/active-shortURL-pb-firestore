"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UrlData {
  id: string
  originalUrl: string
  shortCode: string
  shortUrl: string
  createdAt: string
  totalClicks: number
}

interface LinkHistoryProps {
  refreshTrigger?: number
}

export function LinkHistory({ refreshTrigger }: LinkHistoryProps) {
  const [urls, setUrls] = useState<UrlData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchUrls()
  }, [refreshTrigger])

  const fetchUrls = async () => {
    try {
      // In a real app, this would fetch from your API
      // For now, we'll get from localStorage
      const storedUrls = localStorage.getItem("shortened-urls")
      if (storedUrls) {
        setUrls(JSON.parse(storedUrls))
      }
    } catch (error) {
      console.error("Failed to fetch URLs:", error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const openUrl = (url: string) => {
    window.open(url, "_blank")
  }

  const openAnalytics = (shortCode: string) => {
    router.push(`/analytics/${shortCode}`)
  }

  if (isLoading) {
    return (
      <Card className="w-full border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent URLs</CardTitle>
          <CardDescription className="text-gray-600">Loading your shortened URLs...</CardDescription>
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

  if (urls.length === 0) {
    return (
      <Card className="w-full border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent URLs</CardTitle>
          <CardDescription className="text-gray-600">Your shortened URLs will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No URLs shortened yet. Create your first short URL above!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">Recent URLs</CardTitle>
        <CardDescription className="text-gray-600">Your recently shortened URLs ({urls.length} total)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {urls.map((urlData) => (
            <div key={urlData.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{urlData.shortUrl}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {urlData.totalClicks} clicks
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mb-2">{urlData.originalUrl}</p>
                  <p className="text-xs text-gray-500">Created {new Date(urlData.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(urlData.shortUrl)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openUrl(urlData.shortUrl)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAnalytics(urlData.shortCode)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
