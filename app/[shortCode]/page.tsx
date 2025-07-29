"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function ShortCodeRedirect() {
  const params = useParams()
  const shortCode = params.shortCode as string
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">("loading")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (!shortCode) return

    const handleRedirect = async () => {
      try {
        setStatus("loading")
        console.log(`🔗 Attempting to redirect for shortCode: ${shortCode}`)

        // Make request to the redirect API
        const response = await fetch(`/api/redirect/${shortCode}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log(`📡 API response status: ${response.status}`)

        if (response.redirected) {
          // If the response was redirected by the server, follow it
          console.log(`🚀 Server redirected to: ${response.url}`)
          setStatus("redirecting")
          window.location.href = response.url
          return
        }

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`❌ API error:`, errorData)
          setError(errorData.error || "Failed to redirect")
          setStatus("error")
          return
        }

        // If we get here, check if it's a JSON response with redirect URL
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json()
          if (data.redirectUrl) {
            console.log(`🚀 Client redirecting to: ${data.redirectUrl}`)
            setStatus("redirecting")
            window.location.href = data.redirectUrl
            return
          }
        }

        // If we reach here, something went wrong
        setError("Invalid response from server")
        setStatus("error")
      } catch (err) {
        console.error("❌ Redirect error:", err)
        setError(err instanceof Error ? err.message : "Unknown error occurred")
        setStatus("error")
      }
    }

    handleRedirect()
  }, [shortCode])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
            <p className="text-gray-600 text-center">Preparing your redirect...</p>
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
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h2>
            <p className="text-gray-600 text-center">Taking you to your destination...</p>
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
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Not Found</h2>
            <p className="text-gray-600 text-center mb-4">
              {error || "The short link you're looking for doesn't exist or has expired."}
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
