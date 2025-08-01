"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface UrlShortenerFormProps {
  onUrlCreated?: () => void
  disabled?: boolean
}

export function UrlShortenerForm({ onUrlCreated, disabled }: UrlShortenerFormProps) {
  const [url, setUrl] = useState("")
  const [shortUrl, setShortUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const { getAuthHeaders, isAuthenticated } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      setError("Authentication required")
      return
    }

    if (!url.trim()) {
      setError("Please enter a URL")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create short URL")
      }

      const data = await response.json()
      setShortUrl(data.shortUrl)
      setUrl("")

      toast({
        title: "Success!",
        description: "Short URL created successfully",
      })

      onUrlCreated?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl)
      toast({
        title: "Copied!",
        description: "Short URL copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy URL to clipboard",
        variant: "destructive",
      })
    }
  }

  const openUrl = () => {
    window.open(shortUrl, "_blank")
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Enter your long URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading || disabled}
            className="flex-1"
            style={{ borderColor: "#D9D8FD" }}
          />
          <Button
            type="submit"
            disabled={loading || disabled || !isAuthenticated}
            style={{ backgroundColor: "#833ADF", color: "#FFFFFF", border: "none" }}
            className="hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Shorten URL"
            )}
          </Button>
        </div>
      </form>

      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {!isAuthenticated && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Please wait for authentication to create short URLs
          </AlertDescription>
        </Alert>
      )}

      {shortUrl && (
        <Card className="border-2" style={{ backgroundColor: "#D9D8FD", borderColor: "#833ADF" }}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5" style={{ color: "#833ADF" }} />
              <span className="font-medium" style={{ color: "#4D475B" }}>
                Short URL Created!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={shortUrl}
                readOnly
                className="flex-1 font-mono text-sm"
                style={{ backgroundColor: "#FFFFFF", borderColor: "#833ADF" }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                style={{ backgroundColor: "#FFFFFF", borderColor: "#833ADF", color: "#833ADF" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(131, 58, 223, 0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={openUrl}
                style={{ backgroundColor: "#FFFFFF", borderColor: "#833ADF", color: "#833ADF" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(131, 58, 223, 0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
