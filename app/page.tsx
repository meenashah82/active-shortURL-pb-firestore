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
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Purple header bar like wodify.com */}
      <div className="py-3 px-4" style={{ backgroundColor: "#833ADF", color: "#FFFFFF" }}>
        <div className="container mx-auto text-center text-sm font-medium">
          URL SHORTENER | Transform your long URLs into short, memorable links | GET STARTED
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ color: "#4D475B" }}>
              Make Short URL
            </h1>
            <p className="text-lg mb-8" style={{ color: "#94909C" }}>
              Transform your long URLs into short, memorable links that are easy to share
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="font-medium bg-transparent"
                  style={{
                    borderColor: "#D9D8FD",
                    color: "#4D475B",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
              </Link>
              <Link href="/admin">
                <Button className="font-medium" style={{ backgroundColor: "#F22C7C", color: "#FFFFFF" }}>
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
