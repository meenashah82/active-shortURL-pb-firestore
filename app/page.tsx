"use client"

import { useState } from "react"
import { UrlShortenerForm } from "@/components/url-shortener-form"
import { LinkHistory } from "@/components/link-history"

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUrlCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-h1-hero mb-4">URL Shortener</h1>
            <p className="text-body-regular text-tundora max-w-2xl mx-auto">
              Transform your long URLs into short, memorable links that are easy to share and track.
            </p>
          </div>

          <div className="space-y-8">
            <UrlShortenerForm onUrlCreated={handleUrlCreated} />
            <LinkHistory refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  )
}
