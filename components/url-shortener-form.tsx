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
    <Card className="w-full border-light-purple shadow-sm">
      <CardHeader>
        <CardTitle className="text-tundora">URL Shortener</CardTitle>
        <CardDescription className="text-tundora">Enter a long URL to create a short, shareable link</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/very-long-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 border-light-purple"
              required
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-electric-violet hover:bg-electric-violet/90 text-white"
            >
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
          <div className="p-4 bg-light-gray rounded-lg border border-light-purple">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-tundora mb-1">Your shortened URL:</p>
                <p className="text-sm text-tundora truncate">{shortUrl}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  className="border-light-purple text-tundora hover:bg-light-purple bg-transparent"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(shortUrl, "_blank")}
                  className="border-light-purple text-tundora hover:bg-light-purple"
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
