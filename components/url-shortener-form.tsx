"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, ExternalLink, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UrlShortenerFormProps {
  onUrlCreated?: () => void
}

export function UrlShortenerForm({ onUrlCreated }: UrlShortenerFormProps) {
  const [url, setUrl] = useState("")
  const [shortUrl, setShortUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error("Failed to shorten URL")
      }

      const data = await response.json()
      setShortUrl(data.shortUrl)
      onUrlCreated?.()

      toast({
        title: "Success!",
        description: "Your URL has been shortened successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to shorten URL. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl)
      toast({
        title: "Copied!",
        description: "Short URL copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full shadow-sm" style={{ borderColor: "#D9D8FD", backgroundColor: "#FFFFFF" }}>
      <CardHeader>
        <CardTitle style={{ color: "#4D475B" }}>URL Shortener</CardTitle>
        <CardDescription style={{ color: "#94909C" }}>
          Enter a long URL to create a short, shareable link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/very-long-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              style={{ borderColor: "#D9D8FD", color: "#4D475B" }}
              required
            />
            <Button type="submit" disabled={isLoading} style={{ backgroundColor: "#833ADF", color: "#FFFFFF" }}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Shortening...
                </>
              ) : (
                "Shorten"
              )}
            </Button>
          </div>
        </form>

        {shortUrl && (
          <div className="p-4 rounded-lg border" style={{ backgroundColor: "#D9D8FD", borderColor: "#D9D8FD" }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1" style={{ color: "#4D475B" }}>
                  Your shortened URL:
                </p>
                <p className="text-sm truncate" style={{ color: "#94909C" }}>
                  {shortUrl}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  style={{
                    borderColor: "#D9D8FD",
                    color: "#4D475B",
                    backgroundColor: "transparent",
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(shortUrl, "_blank")}
                  style={{
                    borderColor: "#D9D8FD",
                    color: "#4D475B",
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
