"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, Loader2, Link, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShortenedUrl {
  shortCode: string
  shortUrl: string
  originalUrl: string
  isCustom: boolean
}

interface UrlShortenerFormProps {
  onUrlCreated?: (url: ShortenedUrl) => void
}

export function UrlShortenerForm({ onUrlCreated }: UrlShortenerFormProps) {
  const [url, setUrl] = useState("")
  const [customShortcode, setCustomShortcode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ShortenedUrl | null>(null)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          customShortcode: customShortcode.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to shorten URL")
      }

      const shortenedUrl: ShortenedUrl = {
        shortCode: data.shortCode,
        shortUrl: data.shortUrl,
        originalUrl: data.originalUrl,
        isCustom: data.isCustom,
      }

      setResult(shortenedUrl)

      // Save to history
      const history = JSON.parse(localStorage.getItem("linkHistory") || "[]")
      const newEntry = {
        ...shortenedUrl,
        createdAt: new Date().toISOString(),
      }
      history.unshift(newEntry)
      // Keep only the last 50 entries
      if (history.length > 50) {
        history.splice(50)
      }
      localStorage.setItem("linkHistory", JSON.stringify(history))

      // Notify parent component
      if (onUrlCreated) {
        onUrlCreated(shortenedUrl)
      }

      // Reset form
      setUrl("")
      setCustomShortcode("")

      toast({
        title: "URL shortened successfully!",
        description: `Your short URL is ready: ${data.shortUrl}`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to shorten URL",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy URL to clipboard",
        variant: "destructive",
      })
    }
  }

  const openUrl = (url: string) => {
    window.open(url, "_blank")
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Link className="h-6 w-6 text-blue-600" />
          Make Short URL
        </CardTitle>
        <CardDescription>Transform long URLs into short, shareable links instantly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">Enter your long URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/very/long/url/path"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="text-base"
            />
          </div>

          {/* Custom Shortcode Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="customShortcode" className="flex items-center gap-2">
                Custom shortcode (optional)
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </Label>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">
                  {typeof window !== "undefined" ? window.location.origin : "https://yoursite.com"}/
                </span>
                <Input
                  id="customShortcode"
                  placeholder="my-link"
                  value={customShortcode}
                  onChange={(e) => setCustomShortcode(e.target.value)}
                  pattern="[a-zA-Z0-9_-]{3,20}"
                  title="3-20 characters: letters, numbers, hyphens, and underscores only"
                  className="rounded-l-none text-base"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                3-20 characters: letters, numbers, hyphens, and underscores only
              </p>
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={loading || !url.trim()} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Shortening...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Shorten URL
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Result Display */}
        {result && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-green-800">Your short URL is ready!</h3>
                  {result.isCustom && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Custom
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Short URL */}
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Short URL:</p>
                      <code className="text-lg font-mono text-blue-600 break-all">{result.shortUrl}</code>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(result.shortUrl)}
                        title="Copy short URL"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUrl(result.shortUrl)}
                        title="Open short URL"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Original URL */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Original URL:</p>
                    <p className="text-sm text-gray-800 break-all">{result.originalUrl}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
