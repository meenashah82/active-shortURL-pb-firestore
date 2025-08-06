"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, ExternalLink, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface UrlShortenerFormProps {
  onUrlCreated?: () => void
}

export function UrlShortenerForm({ onUrlCreated }: UrlShortenerFormProps) {
  const [url, setUrl] = useState("")
  const [customShortCode, setCustomShortCode] = useState("")
  const [shortUrl, setShortUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCustomOptions, setShowCustomOptions] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a URL to shorten.",
        variant: "destructive",
      })
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL (including http:// or https://).",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const requestBody: { url: string; customShortCode?: string } = { url }
      if (customShortCode.trim()) {
        requestBody.customShortCode = customShortCode.trim()
      }

      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to shorten URL")
      }

      const data = await response.json()
      setShortUrl(data.shortUrl)

      // Store in localStorage for history
      const storedUrls = JSON.parse(localStorage.getItem("shortened-urls") || "[]")
      const newUrl = {
        id: data.shortCode,
        originalUrl: url,
        shortCode: data.shortCode,
        shortUrl: data.shortUrl,
        createdAt: new Date().toISOString(),
        totalClicks: 0,
        isCustom: data.isCustom || false,
      }
      storedUrls.unshift(newUrl)
      localStorage.setItem("shortened-urls", JSON.stringify(storedUrls.slice(0, 50))) // Keep last 50

      toast({
        title: "Success!",
        description: data.isCustom 
          ? "Custom short URL created successfully!" 
          : "URL shortened successfully.",
      })

      // Clear the inputs
      setUrl("")
      setCustomShortCode("")

      // Notify parent component
      onUrlCreated?.()
    } catch (error: any) {
      console.error("Error shortening URL:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to shorten URL. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement("textarea")
      textArea.value = text

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
        input.value = text
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
        prompt("Copy this URL manually:", text)
      }
    }
  }

  return (
    <Card className="w-full border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">Shorten URL</CardTitle>
        <CardDescription className="text-gray-600">
          Enter a long URL to create a short, shareable link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/very/long/url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !url}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
            >
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

          <Collapsible open={showCustomOptions} onOpenChange={setShowCustomOptions}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between text-sm text-gray-600 hover:text-gray-900"
              >
                Custom short code (optional)
                {showCustomOptions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <Input
                type="text"
                placeholder="my-custom-link"
                value={customShortCode}
                onChange={(e) => setCustomShortCode(e.target.value)}
                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                3-20 characters, letters, numbers, hyphens, and underscores only
              </p>
            </CollapsibleContent>
          </Collapsible>
        </form>

        {shortUrl && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 mb-1">Your shortened URL:</p>
                <p className="text-green-700 font-mono text-sm truncate">{shortUrl}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(shortUrl)}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(shortUrl, "_blank")}
                  className="border-green-300 text-green-700 hover:bg-green-100"
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
