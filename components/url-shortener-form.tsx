"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Link2, Copy, ExternalLink, AlertCircle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export function UrlShortenerForm() {
  const [url, setUrl] = useState("")
  const [customShortCode, setCustomShortCode] = useState("")
  const [shortenedUrl, setShortenedUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const validateUrl = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`)
      return urlObj.protocol === "http:" || urlObj.protocol === "https:"
    } catch {
      return false
    }
  }

  const validateCustomShortCode = (code: string) => {
    if (!code) return true // Optional field
    
    // Length check
    if (code.length < 3 || code.length > 20) {
      return "Custom code must be between 3-20 characters"
    }
    
    // Character check
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
      return "Custom code can only contain letters, numbers, hyphens, and underscores"
    }
    
    // Reserved words check
    const reservedWords = ['api', 'admin', 'dashboard', 'analytics', 'auth', 'login', 'register', 'app', 'www']
    if (reservedWords.includes(code.toLowerCase())) {
      return "This code is reserved and cannot be used"
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!url.trim()) {
      setError("Please enter a URL")
      return
    }

    if (!validateUrl(url)) {
      setError("Please enter a valid URL")
      return
    }

    const customValidation = validateCustomShortCode(customShortCode)
    if (customValidation !== true) {
      setError(customValidation as string)
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
          url: url.startsWith("http") ? url : `https://${url}`,
          customShortCode: customShortCode.trim() || undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to shorten URL")
      }

      const fullShortenedUrl = `${window.location.origin}/${data.shortCode}`
      setShortenedUrl(fullShortenedUrl)

      // Store in localStorage for history
      const historyItem = {
        originalUrl: url.startsWith("http") ? url : `https://${url}`,
        shortCode: data.shortCode,
        shortUrl: fullShortenedUrl,
        createdAt: new Date().toISOString(),
        isCustom: !!customShortCode.trim()
      }

      const existingHistory = JSON.parse(localStorage.getItem("urlHistory") || "[]")
      const updatedHistory = [historyItem, ...existingHistory.slice(0, 9)]
      localStorage.setItem("urlHistory", JSON.stringify(updatedHistory))

      toast({
        title: "Success!",
        description: customShortCode.trim() 
          ? `Custom short URL created: ${data.shortCode}`
          : `Short URL created: ${data.shortCode}`,
      })

      // Reset form
      setUrl("")
      setCustomShortCode("")
    } catch (error) {
      console.error("Error shortening URL:", error)
      setError(error instanceof Error ? error.message : "Failed to shorten URL")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortenedUrl)
      toast({
        title: "Copied!",
        description: "Short URL copied to clipboard",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          URL Shortener
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Enter URL to shorten</Label>
            <Input
              id="url"
              type="text"
              placeholder="https://example.com or example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customShortCode">Custom short code (optional)</Label>
            <Input
              id="customShortCode"
              type="text"
              placeholder="my-custom-code"
              value={customShortCode}
              onChange={(e) => setCustomShortCode(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, hyphens, and underscores only
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Shortening..." : "Shorten URL"}
          </Button>
        </form>

        {shortenedUrl && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">Your shortened URL:</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-white rounded border text-sm break-all">
                {shortenedUrl}
              </code>
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={shortenedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
