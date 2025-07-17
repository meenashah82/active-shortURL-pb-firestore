"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Copy, ExternalLink, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function UrlShortenerForm() {
  const [url, setUrl] = useState("")
  const [customShortcode, setCustomShortcode] = useState("")
  const [shortUrl, setShortUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const validateCustomShortcode = (shortcode: string): string | null => {
    if (!shortcode) return null // Optional field

    if (shortcode.length < 3 || shortcode.length > 20) {
      return "Custom shortcode must be between 3-20 characters"
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(shortcode)) {
      return "Custom shortcode can only contain letters, numbers, hyphens, and underscores"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setShortUrl("")

    if (!url) {
      setError("Please enter a URL")
      return
    }

    // Validate custom shortcode if provided
    const shortcodeError = validateCustomShortcode(customShortcode)
    if (shortcodeError) {
      setError(shortcodeError)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          customShortcode: customShortcode.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to shorten URL")
      }

      setShortUrl(data.shortUrl)
      toast({
        title: "Success!",
        description: "Your URL has been shortened successfully.",
      })
    } catch (error) {
      console.error("Error shortening URL:", error)
      setError(error instanceof Error ? error.message : "Failed to shorten URL")
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
      console.error("Failed to copy:", error)
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Shorten Your URL</CardTitle>
        <CardDescription>
          Enter a long URL to get a shortened version. Optionally, provide a custom shortcode.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL to shorten</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/very-long-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="customShortcode">Custom shortcode (optional)</Label>
              <Input
                id="customShortcode"
                type="text"
                placeholder="my-custom-code"
                value={customShortcode}
                onChange={(e) => setCustomShortcode(e.target.value)}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                3-20 characters, letters, numbers, hyphens, and underscores only
              </p>
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Shortening...
                  </>
                ) : (
                  "Shorten URL"
                )}
              </Button>
            </div>
          </div>

          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

          {shortUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 mb-1">Your shortened URL:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-white px-2 py-1 rounded border flex-1 break-all">{shortUrl}</code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="shrink-0 bg-transparent"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(shortUrl, "_blank")}
                      className="shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
