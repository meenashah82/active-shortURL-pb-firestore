"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface RedirectPageProps {
  params: {
    shortCode: string
  }
}

export default function RedirectPage({ params }: RedirectPageProps) {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log(`🔄 CLIENT: Starting redirect for shortCode: ${params.shortCode}`)

        // Call the API to get redirect URL and record the click
        const response = await fetch(`/api/redirect/${params.shortCode}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log(`📡 CLIENT: API response status: ${response.status}`)

        if (!response.ok) {
          console.error(`❌ CLIENT: API response not ok: ${response.status}`)
          if (response.status === 404) {
            setError("Short URL not found")
            return
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log(`📡 CLIENT: API response data:`, data)

        if (data.success && data.redirectUrl) {
          console.log(`🔄 CLIENT: Redirecting to: ${data.redirectUrl}`)
          // Use window.location.href for immediate redirect
          window.location.href = data.redirectUrl
        } else {
          console.error(`❌ CLIENT: Invalid response data:`, data)
          setError("Invalid redirect response")
        }
      } catch (error) {
        console.error(`❌ CLIENT: Error during redirect:`, error)
        setError("Failed to redirect")
      }
    }

    handleRedirect()
  }, [params.shortCode, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-red-600 text-center">
              <h2 className="text-lg font-semibold mb-2">Error</h2>
              <p>{error}</p>
              <button
                onClick={() => router.back()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Redirecting...</h2>
          <p className="text-sm text-gray-600 text-center">Please wait while we redirect you to your destination.</p>
        </CardContent>
      </Card>
    </div>
  )
}
