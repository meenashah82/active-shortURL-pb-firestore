"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, ExternalLink, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface ShortenedUrl {
  shortCode: string
  shortUrl: string
  originalUrl: string
}

export function UrlShortenerForm() {
  const [url, setUrl] = useState("")
  const [shortenedUrl, setShortenedUrl] = useState<ShortenedUrl | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  console.log("UrlShortenerForm - Auth state:", { isAuthenticated, authLoading })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to shorten URL")
      }

      const data = await response.json()
      setShortenedUrl(data)
      setUrl("")

      toast({
        title: "Success!",
        description: "Your URL has been shortened successfully.",
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

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">URL Shortener</CardTitle>
          <CardDescription className="text-center">Loading...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">URL Shortener</CardTitle>
          <CardDescription className="text-center">Please authenticate to access the URL shortener</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">Waiting for authentication token from parent application...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">URL Shortener</CardTitle>
        <CardDescription className="text-center">Transform long URLs into short, shareable links</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Enter your URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !url.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Shortening...
                </>
              ) : (
                "Shorten"
              )}
            </Button>
          </div>
        </form>

        {shortenedUrl && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Short URL:</label>
              <div className="flex gap-2">
                <Input value={shortenedUrl.shortUrl} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(shortenedUrl.shortUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.open(shortenedUrl.shortUrl, "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Original URL:</label>
              <Input value={shortenedUrl.originalUrl} readOnly className="text-muted-foreground" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
