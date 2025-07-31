"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Copy, ExternalLink, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface UrlShortenerFormProps {
  onUrlCreated?: () => void
}

interface ShortenResponse {
  shortCode: string
  shortUrl: string
  originalUrl: string
  isCustom: boolean
}

export function UrlShortenerForm({ onUrlCreated }: UrlShortenerFormProps) {
  const [url, setUrl] = useState("")
  const [customShortcode, setCustomShortcode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ShortenResponse | null>(null)
  const { toast } = useToast()
  const { getAuthHeaders } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL to shorten",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          url: url.trim(),
          customShortcode: customShortcode.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to shorten URL")
      }

      setResult(data)
      setUrl("")
      setCustomShortcode("")
      onUrlCreated?.()

      toast({
        title: "Success!",
        description: "Your URL has been shortened successfully",
      })
    } catch (error) {
      console.error("Error shortening URL:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to shorten URL",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Short URL copied to clipboard",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle style={{ color: "#4D475B" }}>URL Shortener</CardTitle>
        <CardDescription>Enter a long URL to create a short, shareable link</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL to shorten *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/very/long/url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom">Custom short code (optional)</Label>
            <Input
              id="custom"
              type="text"
              placeholder="my-custom-link"
              value={customShortcode}
              onChange={(e) => setCustomShortcode(e.target.value)}
              pattern="[a-zA-Z0-9_-]{3,20}"
              title="3-20 characters: letters, numbers, hyphens, and underscores only"
            />
            <p className="text-sm text-gray-500">3-20 characters: letters, numbers, hyphens, and underscores only</p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Shortening...
              </>
            ) : (
              "Shorten URL"
            )}
          </Button>
        </form>

        {result && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold text-green-700">Success! Your short URL is ready:</h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input value={result.shortUrl} readOnly className="flex-1" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(result.shortUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => window.open(result.shortUrl, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Original URL:</strong> {result.originalUrl}
                  </p>
                  <p>
                    <strong>Short Code:</strong> {result.shortCode}
                  </p>
                  {result.isCustom && (
                    <p className="text-blue-600">
                      <strong>Custom shortcode used</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
