"use client"

import { useState, useEffect } from "react"

export default function AdminPage() {
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const debug: string[] = []

    try {
      debug.push("✓ Component mounted")

      // Check if we're in browser
      if (typeof window === "undefined") {
        debug.push("✗ Running on server side")
      } else {
        debug.push("✓ Running in browser")
      }

      // Check environment variables
      const envVars = [
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
        "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
        "NEXT_PUBLIC_FIREBASE_APP_ID",
      ]

      envVars.forEach((envVar) => {
        if (process.env[envVar]) {
          debug.push(`✓ ${envVar} is set`)
        } else {
          debug.push(`✗ ${envVar} is missing`)
        }
      })

      // Try to import Firebase
      try {
        debug.push("✓ About to import Firebase")
        import("@/lib/firebase")
          .then(() => {
            debug.push("✓ Firebase imported successfully")
            setDebugInfo([...debug, "✓ Firebase imported successfully"])
          })
          .catch((err) => {
            debug.push(`✗ Firebase import failed: ${err.message}`)
            setDebugInfo([...debug, `✗ Firebase import failed: ${err.message}`])
          })
      } catch (err) {
        debug.push(`✗ Firebase import error: ${err}`)
      }

      // Try to import admin-auth
      try {
        debug.push("✓ About to import admin-auth")
        import("@/lib/admin-auth")
          .then(() => {
            debug.push("✓ Admin-auth imported successfully")
            setDebugInfo([...debug, "✓ Admin-auth imported successfully"])
          })
          .catch((err) => {
            debug.push(`✗ Admin-auth import failed: ${err.message}`)
            setDebugInfo([...debug, `✗ Admin-auth import failed: ${err.message}`])
          })
      } catch (err) {
        debug.push(`✗ Admin-auth import error: ${err}`)
      }

      setDebugInfo(debug)
    } catch (err) {
      setError(`Component error: ${err}`)
      console.error("Admin page error:", err)
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Detected</h1>
          <div className="bg-red-100 p-4 rounded text-red-800 font-mono text-sm">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Page Debug</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Information</h2>
          <div className="space-y-2">
            {debugInfo.map((info, index) => (
              <div
                key={index}
                className={`p-2 rounded font-mono text-sm ${
                  info.startsWith("✓") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {info}
              </div>
            ))}
          </div>

          {debugInfo.length === 0 && <div className="text-gray-500">Loading diagnostics...</div>}
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Browser Console</h2>
          <p className="text-gray-600">
            Please check your browser's developer console (F12) for any additional error messages. Look for red error
            messages that might indicate what's failing.
          </p>
        </div>
      </div>
    </div>
  )
}
