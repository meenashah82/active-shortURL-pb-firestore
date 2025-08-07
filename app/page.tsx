"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UrlShortenerForm } from "@/components/url-shortener-form"
import { LinkHistory } from "@/components/link-history"
import { DatabaseDiagnostic } from "@/components/database-diagnostic"
import { BarChart3, Shield, User, LogOut, AlertTriangle } from 'lucide-react'
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const { user, isLoading, isAuthenticated, login, logout } = useAuth()
  const router = useRouter()

  const handleUrlCreated = () => {
    // Trigger history refresh
    setRefreshTrigger((prev) => prev + 1)
  }

  const navigateToDashboard = () => {
    router.push("/dashboard")
  }

  const navigateToAdmin = () => {
    router.push("/admin")
  }

  useEffect(() => {
    // Tell dev.wodify.com that the app is loaded
    const notifyParentLoaded = () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "APP_LOADED" }, "https://dev.wodify.com")
        console.log("Sent APP_LOADED message to parent")
      }
    }

    // Listen for token from parent iframe
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== "https://dev.wodify.com") {
        return
      }

      if (event.data && event.data.type === "TOKEN") {
        console.log("Received token from parent:", event.data.token)

        // Authenticate with the received token
        const success = await login(event.data.token)
        if (success) {
          console.log("Successfully authenticated with Wodify token")
        } else {
          console.error("Failed to authenticate with Wodify token")
        }
      }
    }

    // Notify parent that app is loaded
    notifyParentLoaded()

    // Add message listener
    window.addEventListener("message", handleMessage)

    // Cleanup
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [login])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            This app requires authentication from Wodify. Please ensure you're accessing this app through the Wodify
            platform.
          </p>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
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
              <User className="h-4 w-4" />
              <span>Customer: {user?.customerId}</span>
              <span>User: {user?.userId}</span>
            </div>
            <button onClick={logout} className="flex items-center gap-1 hover:bg-[#6D28D9] px-2 py-1 rounded">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Critical Issue Alert */}
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>🚨 CRITICAL ISSUE DETECTED:</strong> Your Firebase security rules are blocking database access. This is why URL shortening and admin login stopped working.
                </div>
                <Button 
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  variant="outline"
                  size="sm"
                  className="bg-white"
                >
                  {showDiagnostics ? "Hide" : "Show"} Fix Instructions
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* Database Diagnostics */}
          {showDiagnostics && (
            <div className="mb-8">
              <DatabaseDiagnostic />
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Make Short URL</h1>
            <p className="text-lg text-gray-600 mb-8">
              Transform your long URLs into short, memorable links that are easy to share
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={navigateToDashboard}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white font-medium"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Dashboard
              </Button>
              <Button onClick={navigateToAdmin} className="bg-[#EC4899] hover:bg-[#DB2777] text-white font-medium">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </div>
          </div>

          {/* URL Shortener Form */}
          <div className="mb-12">
            <UrlShortenerForm onUrlCreated={handleUrlCreated} />
          </div>

          {/* Link History */}
          <LinkHistory refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  )
}
