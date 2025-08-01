"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UrlShortenerForm } from "@/components/url-shortener-form"
import { LinkHistory } from "@/components/link-history"
import { LinkIcon, Zap, BarChart3, Shield, User, Building2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

export default function HomePage() {
  const { user, loading, error, isAuthenticated } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUrlCreated = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#833ADF" }} />
          <span className="font-medium" style={{ color: "#4D475B" }}>
            Loading authentication...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Auth Status Header */}
          <Card className="mb-8 shadow-sm" style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5" style={{ color: isAuthenticated ? "#833ADF" : "#94909C" }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: "#4D475B" }}>
                        Authentication Status:
                      </span>
                      <Badge
                        variant={isAuthenticated ? "default" : "secondary"}
                        className={isAuthenticated ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                      >
                        {isAuthenticated ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Authenticated
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Waiting for Wodify Token
                          </div>
                        )}
                      </Badge>
                    </div>
                    {isAuthenticated && user && (
                      <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: "#94909C" }}>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>Customer ID: {user.customerId}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>User ID: {user.userId}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">Authentication Error: {error}</AlertDescription>
            </Alert>
          )}

          {!isAuthenticated && (
            <Alert className="mb-8 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Waiting for Wodify authentication token. This app requires authentication to function.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ color: "#4D475B" }}>
              URL Shortener
            </h1>
            <p className="text-xl mb-6" style={{ color: "#94909C" }}>
              Transform long URLs into short, shareable links with real-time analytics
            </p>

            <div className="flex justify-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" style={{ color: "#833ADF" }} />
                <span className="text-sm font-medium" style={{ color: "#4D475B" }}>
                  Short Links
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" style={{ color: "#833ADF" }} />
                <span className="text-sm font-medium" style={{ color: "#4D475B" }}>
                  Real-time Updates
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" style={{ color: "#833ADF" }} />
                <span className="text-sm font-medium" style={{ color: "#4D475B" }}>
                  Analytics
                </span>
              </div>
            </div>
          </div>

          {/* URL Shortener Form */}
          <Card className="mb-8 shadow-lg" style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
            <CardHeader>
              <CardTitle style={{ color: "#4D475B" }}>Create Short URL</CardTitle>
              <CardDescription style={{ color: "#94909C" }}>
                Enter a long URL to create a short, shareable link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UrlShortenerForm onUrlCreated={handleUrlCreated} disabled={!isAuthenticated} />
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#D9D8FD",
                  color: "#833ADF",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(131, 58, 223, 0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                disabled={!isAuthenticated}
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#D9D8FD",
                  color: "#833ADF",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(131, 58, 223, 0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                disabled={!isAuthenticated}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          </div>

          <Separator className="mb-8" style={{ backgroundColor: "#D9D8FD" }} />

          {/* Link History */}
          <Card className="shadow-sm" style={{ backgroundColor: "#FFFFFF", borderColor: "#D9D8FD" }}>
            <CardHeader>
              <CardTitle style={{ color: "#4D475B" }}>Recent URLs</CardTitle>
              <CardDescription style={{ color: "#94909C" }}>
                Your recently created short URLs with click analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LinkHistory key={refreshKey} disabled={!isAuthenticated} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
