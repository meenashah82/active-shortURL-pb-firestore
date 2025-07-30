"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

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
      await navigator.clipboard.writeText(url)
      toast({
        title: "Copied!",
        description: "URL copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
        <CardHeader>
          <CardTitle style={{ color: "#4D475B" }}>Recent URLs</CardTitle>
          <CardDescription style={{ color: "#94909C" }}>Loading your shortened URLs...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: "#D9D8FD" }} />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (urls.length === 0) {
    return (
      <Card className="w-full shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
        <CardHeader>
          <CardTitle style={{ color: "#4D475B" }}>Recent URLs</CardTitle>
          <CardDescription style={{ color: "#94909C" }}>Your shortened URLs will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p style={{ color: "#94909C" }}>No URLs shortened yet. Create your first short URL above!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
      <CardHeader>
        <CardTitle style={{ color: "#4D475B" }}>Recent URLs</CardTitle>
        <CardDescription style={{ color: "#94909C" }}>
          Your recently shortened URLs ({urls.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {urls.map((urlData) => (
            <div
              key={urlData.id}
              className="p-4 border rounded-lg hover:bg-opacity-50 transition-colors"
              style={{ borderColor: "#D9D8FD", backgroundColor: "rgba(217, 216, 253, 0.1)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium truncate" style={{ color: "#4D475B" }}>
                      {urlData.shortUrl}
                    </h3>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: "#94909C", backgroundColor: "#D9D8FD" }}
                    >
                      {urlData.totalClicks} clicks
                    </span>
                  </div>
                  <p className="text-sm truncate mb-2" style={{ color: "#94909C" }}>
                    {urlData.originalUrl}
                  </p>
                  <p className="text-xs" style={{ color: "#94909C" }}>
                    Created {new Date(urlData.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(urlData.shortUrl)}
                    style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(urlData.shortUrl, "_blank")}
                    style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Link href={`/analytics/${urlData.shortCode}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      style={{ borderColor: "#D9D8FD", color: "#4D475B", backgroundColor: "transparent" }}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
