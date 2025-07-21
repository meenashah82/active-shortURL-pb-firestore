"use client"

import { useState, useEffect } from "react"

export default function AdminPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    const initializeAdmin = async () => {
      const debug: string[] = []

      try {
        debug.push("Starting admin page initialization...")

        // Check if we're in browser
        if (typeof window === "undefined") {
          debug.push("Running on server side")
          setDebugInfo(debug)
          setLoading(false)
          return
        }

        debug.push("Running on client side")

        // Try to import Firebase
        try {
          debug.push("Importing Firebase...")
          const { db } = await import("@/lib/firebase")

          if (!db) {
            throw new Error("Firebase database is null")
          }

          debug.push("✓ Firebase imported successfully")
        } catch (firebaseError) {
          debug.push(`✗ Firebase import failed: ${firebaseError}`)
          setError(`Firebase Error: ${firebaseError}`)
          setDebugInfo(debug)
          setLoading(false)
          return
        }

        // Try to import admin auth
        try {
          debug.push("Importing admin auth...")
          const adminAuth = await import("@/lib/admin-auth")
          debug.push("✓ Admin auth imported successfully")
        } catch (authError) {
          debug.push(`✗ Admin auth import failed: ${authError}`)
          setError(`Admin Auth Error: ${authError}`)
          setDebugInfo(debug)
          setLoading(false)
          return
        }

        // Try to import components
        try {
          debug.push("Importing admin components...")
          const { default: AdminLogin } = await import("@/components/admin-login")
          debug.push("✓ Admin components imported successfully")
        } catch (componentError) {
          debug.push(`✗ Component import failed: ${componentError}`)
          setError(`Component Error: ${componentError}`)
          setDebugInfo(debug)
          setLoading(false)
          return
        }

        debug.push("✓ All imports successful")
        setDebugInfo(debug)
        setLoading(false)
      } catch (globalError) {
        debug.push(`✗ Global error: ${globalError}`)
        setError(`Global Error: ${globalError}`)
        setDebugInfo(debug)
        setLoading(false)
      }
    }

    initializeAdmin()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Admin Panel Error</h1>

          <div className="bg-red-100 p-4 rounded text-red-800 font-mono text-sm whitespace-pre-wrap mb-4">{error}</div>

          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">Debug Information:</h3>
            <div className="space-y-1">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-sm font-mono">
                  {info}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              <strong>Troubleshooting:</strong>
              <br />
              1. Check that all environment variables are set in Vercel
              <br />
              2. Verify Firebase configuration is correct
              <br />
              3. Check browser console for additional errors
              <br />
              4. Try visiting{" "}
              <a href="/debug" className="underline">
                /debug
              </a>{" "}
              for more details
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Panel</h1>
        <p className="text-center text-gray-600">
          If you see this message, the basic imports are working but the full admin system needs to be loaded.
        </p>

        <div className="mt-6 p-4 bg-green-50 rounded">
          <h3 className="font-semibold text-green-800 mb-2">Success!</h3>
          <div className="space-y-1 text-sm">
            {debugInfo.map((info, index) => (
              <div key={index} className="font-mono text-green-700">
                {info}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
