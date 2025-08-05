"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { migrateToClicksCollection } from "@/lib/analytics-clean"
import { CheckCircle, AlertCircle, Loader2, Database } from "lucide-react"

export default function MigrateClicksPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    error?: string
    timestamp?: string
  } | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      console.log("🔄 Starting clicks collection migration...")
      await migrateToClicksCollection()

      setResult({
        success: true,
        message: "Successfully created clicks collection documents for all existing shortcodes",
        timestamp: new Date().toISOString(),
      })

      console.log("✅ Clicks collection migration completed successfully")
    } catch (error) {
      console.error("❌ Migration failed:", error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <Database className="h-8 w-8 text-purple-600" />
          Migrate to Clicks Collection
        </h1>
        <p className="text-gray-600">
          Create documents in the new "clicks" collection for all existing shortcodes in the database.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Migration Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">What this migration does:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Scans all documents in the "urls" collection</li>
              <li>• Creates corresponding documents in the new "clicks" collection</li>
              <li>• Preserves shortCode, createdAt, and isActive fields</li>
              <li>• Skips documents that already exist in clicks collection</li>
              <li>• Does not modify any existing data</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">⚠️ Before running:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Make sure you have proper Firestore permissions</li>
              <li>• This operation is safe and won't modify existing data</li>
              <li>• You can run this multiple times safely</li>
              <li>• Check the browser console for detailed logs</li>
            </ul>
          </div>

          <Button onClick={runMigration} disabled={isRunning} className="w-full" size="lg">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Run Clicks Collection Migration
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-800">Migration Successful!</h3>
                  </div>
                  <p className="text-sm text-green-700">{result.message}</p>
                  <p className="text-xs text-green-600 mt-2">
                    Completed at: {new Date(result.timestamp!).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-medium text-red-800">Migration Failed</h3>
                  </div>
                  <p className="text-sm text-red-700">{result.error}</p>
                  <p className="text-xs text-red-600 mt-2">Failed at: {new Date(result.timestamp!).toLocaleString()}</p>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">Next Steps:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Check your Firestore Console to verify the "clicks" collection was created</li>
                  <li>• Verify that each shortcode has a corresponding document in the clicks collection</li>
                  <li>• The clicks collection is now ready for future enhancements</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔍 Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="space-y-1">
              <p className="font-medium">Common Issues:</p>
              <ul className="ml-4 space-y-1 text-gray-600">
                <li>• Insufficient Firestore permissions</li>
                <li>• Network connectivity issues</li>
                <li>• Browser console errors</li>
                <li>• Firestore rules blocking writes</li>
              </ul>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p className="font-medium text-blue-800">Debug Steps:</p>
              <ol className="text-blue-700 text-sm mt-1 space-y-1">
                <li>1. Open browser developer tools and check the console</li>
                <li>2. Verify your Firebase configuration is correct</li>
                <li>3. Check Firestore rules allow writes to the "clicks" collection</li>
                <li>4. Ensure you have internet connectivity</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
