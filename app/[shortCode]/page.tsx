"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ExternalLink, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RedirectPage() {
  const params = useParams()
  const shortCode = params.shortCode as string
  const [status, setStatus] = useState<"loading" | "redirecting" | "error" | "not-found">("loading")
  const [originalUrl, setOriginalUrl] = useState<string>("")
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log(`🔍 Fetching redirect for: ${shortCode}`)

        const response = await fetch(`/api/redirect/${shortCode}`)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 404) {
            setStatus("not-found")
          } else {
            setStatus("error")
          }
          return
        }

        if (data.redirectUrl) {
          setOriginalUrl(data.redirectUrl)
          setStatus("redirecting")

          // Start countdown
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer)
                window.location.href = data.redirectUrl
                return 0
              }
              return prev - 1
            })
          }, 1000)

          return () => clearInterval(timer)
        } else {
          setStatus("error")
        }
      } catch (error) {
        console.error("❌ Redirect error:", error)
        setStatus("error")
      }
    }

    if (shortCode) {
      handleRedirect()
    }
  }, [shortCode])

  const handleManualRedirect = () => {
    if (originalUrl) {
      window.location.href = originalUrl
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Looking up link...</h1>
            <p className="text-gray-600 text-center">Please wait while we find your destination.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "not-found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Link Not Found</h1>
            <p className="text-gray-600 text-center mb-4">
              The short link you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
              <a href="/">Create a New Link</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 text-center mb-4">We encountered an error while trying to redirect you.</p>
            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
              <a href="/">Go Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "redirecting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <ExternalLink className="h-12 w-12 text-purple-600 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h1>
            <p className="text-gray-600 text-center mb-4">
              You'll be redirected to your destination in {countdown} second{countdown !== 1 ? "s" : ""}.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mb-4 break-all">Destination: {originalUrl}</p>
            <Button onClick={handleManualRedirect} className="bg-purple-600 hover:bg-purple-700 text-white">
              Go Now
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
