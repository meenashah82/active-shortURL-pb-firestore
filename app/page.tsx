"use client"

import { useState } from "react"
import { UrlShortenerForm } from "@/components/url-shortener-form"
import { LinkHistory } from "@/components/link-history"
import { Button } from "@/components/ui/button"
import { BarChart3, Shield } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUrlCreated = () => {
    // Trigger history refresh
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Make Short URL</h1>
            <p className="text-lg text-gray-600 mb-6">
              Transform your long URLs into short, memorable links that are easy to share
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            </div>
          </div>

          {/* URL Shortener Form */}
          <div className="mb-8">
            <UrlShortenerForm onUrlCreated={handleUrlCreated} />
          </div>

          {/* Link History */}
          <LinkHistory refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  )
}
