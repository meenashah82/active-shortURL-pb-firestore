"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, User, Building } from "lucide-react"
import { UrlShortenerForm } from "@/components/url-shortener-form"
import { RecentUrls } from "@/components/recent-urls"
import { useAuth } from "@/hooks/use-auth"

export default function Home() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth()
  const [iframeReady, setIframeReady] = useState(false)

  useEffect(() => {
    // Notify parent that app is loaded
    if (window.parent !== window) {
      window.parent.postMessage({ type: "APP_LOADED" }, "https://dev.wodify.com")
      setIframeReady(true)
    }

    // Listen for token from parent
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== "https://dev.wodify.com") {
        return
      }

      if (event.data.type === "TOKEN" && event.data.token) {
        console.log("Received token from parent:", event.data.token)
        const success = await login(event.data.token)
        if (!success) {
          console.error("Failed to authenticate with received token")
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [login])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              {iframeReady
                ? "Waiting for authentication token from Wodify..."
                : "This app must be loaded from Wodify to authenticate."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Purple header bar like wodify.com */}
      <div className="bg-[#7C3AED] text-white py-3 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-center flex-1 text-sm font-medium">
            URL SHORTENER | Transform your long URLs into short, memorable links | GET STARTED
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Customer: {user?.customerId}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>User: {user?.userId}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:bg-[#6D28D9]">
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#4D475B] mb-4">Make Short URL</h1>
            <p className="text-lg text-gray-600 mb-8">
              Transform your long URLs into short, memorable links that are easy to share
            </p>
          </div>

          {/* URL Shortener Form */}
          <div className="mb-12">
            <UrlShortenerForm />
          </div>

          {/* Recent URLs */}
          <RecentUrls />
        </div>
      </div>
    </div>
  )
}
