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
    <div className="min-h-screen bg-white">
      {/* Purple header bar like wodify.com */}
      <div className="bg-[#7C3AED] text-white py-3 px-4">
        <div className="container mx-auto text-center text-sm font-medium">
          URL SHORTENER | Transform your long URLs into short, memorable links | GET STARTED
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Make Short URL</h1>
            <p className="text-lg text-gray-600 mb-8">
              Transform your long URLs into short, memorable links that are easy to share
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white font-medium"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
              </Link>
              <Link href="/admin">
                <Button className="bg-[#EC4899] hover:bg-[#DB2777] text-white font-medium">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
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
