"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { db } from "@/lib/firebase"
import { doc, getDoc, runTransaction, increment, serverTimestamp, arrayUnion } from "firebase/firestore"
import { RefreshCw, Target, AlertCircle, CheckCircle } from "lucide-react"

export default function DebugTotalClicks() {
  const [shortCode, setShortCode] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkAnalyticsDoc = async () => {
    if (!shortCode) return

    setLoading(true)
    try {
      const analyticsRef = doc(db, "analytics", shortCode)
      const analyticsSnap = await getDoc(analyticsRef)

      if (analyticsSnap.exists()) {
        const data = analyticsSnap.data()
        setResult({
          exists: true,
          data,
          timestamp: new Date().toISOString(),
        })
      } else {
        setResult({
          exists: false,
          message: "Analytics document does not exist",
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      setResult({
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const testDirectIncrement = async () => {
    if (!shortCode) return

    setLoading(true)
    try {
      console.log(`🧪 Testing direct increment for: ${shortCode}`)

      const analyticsRef = doc(db, "analytics", shortCode)

      await runTransaction(db, async (transaction) => {
        const analyticsDoc = await transaction.get(analyticsRef)

        console.log(`📊 Document exists: ${analyticsDoc.exists()}`)

        const clickEvent = {
          id: `test-${Date.now()}`,
          timestamp: serverTimestamp(),
          userAgent: "Test User Agent",
          referer: "Debug Page",
          ip: "127.0.0.1",
          sessionId: `test-${Date.now()}`,
          clickSource: "test" as const,
        }

        if (analyticsDoc.exists()) {
          const currentData = analyticsDoc.data()
          console.log(`📈 Current totalClicks: ${currentData.totalClicks || 0}`)

          transaction.update(analyticsRef, {
            totalClicks: increment(1),
            lastClickAt: serverTimestamp(),
            clickEvents: arrayUnion(clickEvent),
          })
          console.log(`✅ Update transaction queued`)
        } else {
          console.log(`📝 Creating new analytics document`)
          transaction.set(analyticsRef, {
            shortCode,
            totalClicks: 1,
            createdAt: serverTimestamp(),
            lastClickAt: serverTimestamp(),
            clickEvents: [clickEvent],
          })
          console.log(`✅ Set transaction queued`)
        }
      })

      console.log(`✅ Transaction completed`)

      // Verify the result
      const verifySnap = await getDoc(analyticsRef)
      if (verifySnap.exists()) {
        const verifyData = verifySnap.data()
        console.log(`🔍 Verification: totalClicks is now ${verifyData.totalClicks}`)

        setResult({
          success: true,
          message: `Direct increment test completed. totalClicks is now: ${verifyData.totalClicks}`,
          data: verifyData,
          timestamp: new Date().toISOString(),
        })
      } else {
        setResult({
          error: "Document doesn't exist after transaction",
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error(`❌ Direct increment test failed:`, error)
      setResult({
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const testRedirectAPI = async () => {
    if (!shortCode) return

    setLoading(true)
    try {
      console.log(`🔗 Testing redirect API for: ${shortCode}`)

      const response = await fetch(`/api/redirect/${shortCode}`)
      const data = await response.json()

      console.log(`📡 API Response:`, data)

      setResult({
        apiTest: true,
        status: response.status,
        response: data,
        timestamp: new Date().toISOString(),
      })

      // Check analytics after API call
      setTimeout(async () => {
        const analyticsRef = doc(db, "analytics", shortCode)
        const analyticsSnap = await getDoc(analyticsRef)
        if (analyticsSnap.exists()) {
          const analyticsData = analyticsSnap.data()
          console.log(`🔍 Analytics after API call: totalClicks = ${analyticsData.totalClicks}`)
        }
      }, 2000)
    } catch (error) {
      setResult({
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🔧 Debug totalClicks Issue</h1>
        <p className="text-gray-600">Debug why totalClicks field is not updating in Firestore</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Debug Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Short Code:</label>
            <Input
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              placeholder="Enter short code (e.g., abc123)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button onClick={checkAnalyticsDoc} disabled={loading || !shortCode}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Analytics Doc
            </Button>

            <Button onClick={testDirectIncrement} disabled={loading || !shortCode} variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Test Direct Increment
            </Button>

            <Button onClick={testRedirectAPI} disabled={loading || !shortCode} variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              Test Redirect API
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <strong>Debug Steps:</strong>
            </p>
            <p>1. Check if analytics document exists and see current totalClicks</p>
            <p>2. Test direct increment to see if Firestore increment() works</p>
            <p>3. Test the redirect API to see if it updates analytics</p>
            <p>4. Check browser console for detailed logs</p>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.exists === true && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Analytics Document Found
                  </h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>
                      <strong>Total Clicks:</strong> {result.data.totalClicks}
                    </p>
                    <p>
                      <strong>Click Events:</strong> {result.data.clickEvents?.length || 0}
                    </p>
                    <p>
                      <strong>Last Click:</strong> {result.data.lastClickAt?.toDate?.()?.toLocaleString() || "Never"}
                    </p>
                    <p>
                      <strong>Created:</strong> {result.data.createdAt?.toDate?.()?.toLocaleString() || "Unknown"}
                    </p>
                  </div>
                </div>
              )}

              {result.exists === false && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">⚠️ Analytics Document Not Found</h3>
                  <p className="text-sm text-yellow-700">
                    The analytics document doesn't exist yet. Try creating a short URL first or use direct increment
                    test.
                  </p>
                </div>
              )}

              {result.success && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">🎯 Direct Increment Test Result</h3>
                  <p className="text-sm text-blue-700">{result.message}</p>
                </div>
              )}

              {result.apiTest && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-medium text-purple-800 mb-2">🔗 API Test Result</h3>
                  <div className="text-sm text-purple-700 space-y-1">
                    <p>
                      <strong>Status:</strong> {result.status}
                    </p>
                    <p>
                      <strong>Success:</strong> {result.response.success ? "Yes" : "No"}
                    </p>
                    {result.response.redirectUrl && (
                      <p>
                        <strong>Redirect URL:</strong> {result.response.redirectUrl}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-2">❌ Error</h3>
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">View Raw Data</summary>
                <pre className="text-xs bg-gray-100 p-3 rounded mt-2 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔍 Troubleshooting Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div className="space-y-1">
              <p className="font-medium">Common Issues:</p>
              <ul className="ml-4 space-y-1 text-gray-600">
                <li>• Analytics document doesn't exist (create it first)</li>
                <li>• Firestore rules blocking writes</li>
                <li>• Transaction conflicts or timeouts</li>
                <li>• Network connectivity issues</li>
                <li>• Browser console errors</li>
                <li>• increment() function not working properly</li>
              </ul>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p className="font-medium text-blue-800">Next Steps:</p>
              <ol className="text-blue-700 text-sm mt-1 space-y-1">
                <li>1. Use "Test Direct Increment" to see if increment() works at all</li>
                <li>2. Check browser console for detailed transaction logs</li>
                <li>3. Verify Firestore Console shows the changes</li>
                <li>4. Test the redirect API to see if it triggers updates</li>
                <li>5. Check if there are any Firestore security rule issues</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
