import { UrlShortenerForm } from "@/components/url-shortener-form"
import { LinkHistory } from "@/components/link-history"
import { RecentUrls } from "@/components/recent-urls"
import { Button } from "@/components/ui/button"
import { BarChart3, Link } from "lucide-react"
import NextLink from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Link className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">Make Short URL</h1>
            </div>
            <p className="text-lg text-gray-600 mb-6">Transform long URLs into short, shareable links instantly</p>
            <NextLink href="/dashboard">
              <Button variant="outline" className="gap-2 bg-transparent">
                <BarChart3 className="h-4 w-4" />
                View Dashboard
              </Button>
            </NextLink>
          </div>

          {/* URL Shortener Form */}
          <div className="mb-8">
            <UrlShortenerForm />
          </div>

          {/* Link History */}
          <div className="mb-8">
            <LinkHistory />
          </div>

          {/* Recent URLs from all users */}
          <div>
            <RecentUrls />
          </div>
        </div>
      </div>
    </div>
  )
}
