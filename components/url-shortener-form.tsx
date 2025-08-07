"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, ExternalLink, Loader2 } from 'lucide-react'
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
    console.log("🚀 Form submission started")

    if (!url) {
      console.log("❌ No URL provided")
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
      console.log("✅ URL validation passed:", url)
    } catch {
      console.log("❌ URL validation failed:", url)
      toast({
        title: "Error",
        description: "Please enter a valid URL (including http:// or https://).",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    console.log("🔄 Starting API call to /api/shorten")

    try {
      const requestBody = { url }
      console.log("📤 Sending request:", requestBody)

      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("📥 Response status:", response.status)
      console.log("📥 Response ok:", response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("❌ Error response data:", errorData)
        throw new Error(errorData.error || "Failed to shorten URL")
      }

      const data = await response.json()
      console.log("✅ Success response data:", data)
      
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
      }
      storedUrls.unshift(newUrl)
      localStorage.setItem("shortened-urls", JSON.stringify(storedUrls.slice(0, 50))) // Keep last 50
      console.log("💾 Saved to localStorage:", newUrl)

      toast({
        title: "Success!",
        description: "URL shortened successfully.",
      })

      // Clear the input
      setUrl("")

      // Notify parent component
      onUrlCreated?.()
      console.log("🎉 Form submission completed successfully")
    } catch (error: any) {
      console.error("❌ Error shortening URL:", error)
      console.error("❌ Error message:", error.message)
      console.error("❌ Error stack:", error.stack)
      
      toast({
        title: "Error",
        description: error.message || "Failed to shorten URL. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      console.log("🏁 Form submission finished (loading state cleared)")
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
