"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function RedirectPage() {
  const params = useParams()
  const shortCode = params.shortCode as string
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log(`🔄 Starting redirect process for shortCode: ${shortCode}`)

        // Call the redirect API endpoint
        const response = await fetch(`/api/redirect/${shortCode}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log(`📡 API response status: ${response.status}`)

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`❌ API error:`, errorData)
          setError(errorData.error || "Failed to redirect")
          return
        }

        const data = await response.json()
        console.log(`✅ API response data:`, data)

        if (data.redirectUrl) {
          console.log(`🚀 Redirecting to: ${data.redirectUrl}`)
          // Perform the redirect
          window.location.href = data.redirectUrl
        } else {
          console.error(`❌ No redirect URL in response`)
          setError("No redirect URL found")
        }
      } catch (error) {
        console.error(`❌ Redirect error:`, error)
        setError("Failed to process redirect")
      }
    }

    if (shortCode) {
      // Small delay to ensure the page renders before redirect
      const timer = setTimeout(handleRedirect, 100)
      return () => clearTimeout(timer)
    }
  }, [shortCode])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Redirect Failed</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h1>
        <p className="text-gray-600">Please wait while we redirect you to your destination.</p>
      </div>
    </div>
  )
}
