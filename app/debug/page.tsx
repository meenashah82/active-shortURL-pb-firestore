"use client"

import { useState, useEffect } from "react"

export default function DebugPage() {
  const [status, setStatus] = useState<string>("Loading...")
  const [details, setDetails] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkEverything = async () => {
      const results: string[] = []

      try {
        results.push("Starting diagnostics...")

        // Check environment
        const requiredEnvVars = [
          "NEXT_PUBLIC_FIREBASE_API_KEY",
          "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
          "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
          "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
          "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
          "NEXT_PUBLIC_FIREBASE_APP_ID",
        ]

        let envOk = true
        requiredEnvVars.forEach((envVar) => {
          if (process.env[envVar]) {
            results.push(`✓ ${envVar}: ${process.env[envVar]?.substring(0, 10)}...`)
          } else {
            results.push(`✗ ${envVar}: MISSING`)
            envOk = false
          }
        })

        if (!envOk) {
          results.push("❌ Environment variables are missing!")
          setStatus("Environment Error")
          setDetails(results)
          return
        }

        // Try Firebase
        try {
          results.push("Attempting Firebase import...")
          const { db } = await import("@/lib/firebase")

          if (db) {
            results.push("✓ Firebase database initialized")

            // Try a simple operation
            try {
              const { collection, getDocs } = await import("firebase/firestore")
              results.push("✓ Firestore functions imported")

              // Try to read from a collection (this might fail but tells us more)
              const testCollection = collection(db, "test")
              results.push("✓ Test collection reference created")
            } catch (firestoreError) {
              results.push(`⚠️ Firestore operation failed: ${firestoreError}`)
            }
          } else {
            results.push("✗ Firebase database is null")
          }
        } catch (firebaseError) {
          results.push(`✗ Firebase import failed: ${firebaseError}`)
        }

        // Try admin auth
        try {
          results.push("Attempting admin-auth import...")
          const adminAuth = await import("@/lib/admin-auth")
          results.push("✓ Admin-auth imported successfully")

          // Try to call a function
          try {
            const users = await adminAuth.getAllAdminUsers()
            results.push(`✓ Found ${users.length} admin users`)
          } catch (authError) {
            results.push(`⚠️ Admin auth function failed: ${authError}`)
          }
        } catch (authImportError) {
          results.push(`✗ Admin-auth import failed: ${authImportError}`)
        }

        setStatus("Diagnostics Complete")
        setDetails(results)
      } catch (globalError) {
        setError(`Global error: ${globalError}`)
        setDetails(results)
      }
    }

    checkEverything()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Critical Error</h1>
          <div className="bg-red-100 p-4 rounded text-red-800 font-mono text-sm whitespace-pre-wrap">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Dashboard</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>

          <div className="space-y-2">
            {details.map((detail, index) => (
              <div
                key={index}
                className={`p-2 rounded font-mono text-sm ${
                  detail.startsWith("✓")
                    ? "bg-green-100 text-green-800"
                    : detail.startsWith("✗") || detail.startsWith("❌")
                      ? "bg-red-100 text-red-800"
                      : detail.startsWith("⚠️")
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {detail}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="space-y-2 text-sm">
            <p>1. Check the diagnostic results above</p>
            <p>2. Open browser developer tools (F12) and check the Console tab</p>
            <p>3. Look for any red error messages</p>
            <p>4. If you see Firebase errors, verify your environment variables</p>
            <p>5. If you see import errors, there might be a build issue</p>
          </div>
        </div>
      </div>
    </div>
  )
}
