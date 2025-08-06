"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { doc, getDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface AnalyticsData {
  shortCode: string
  totalClicks: number
  createdAt: any
  lastClickAt?: any
  // ✅ REMOVED: clickEvents array (redundant with shortcode_clicks subcollection)
}

export default function DebugTotalClicksPage() {
  const [shortCode, setShortCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  const fetchAnalyticsData = async (code: string) => {
    try {
      const analyticsRef = doc(db, "analytics", code)
      const analyticsSnap = await getDoc(analyticsRef)

      if (analyticsSnap.exists()) {
        const data = analyticsSnap.data() as AnalyticsData
        setAnalyticsData(data)
        return data
      } else {
        setAnalyticsData(null)
        return null
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setAnalyticsData(null)
      return null
    }
  }

  const testDirectIncrement = async () => {
    if (!shortCode) {
      setResult("Please enter a short code")
      return
    }

    setLoading(true)
    try {
      console.log(`🧪 Testing direct increment for: ${shortCode}`)

      const analyticsRef = doc(db, "analytics", shortCode)

      // Check if document exists first
      const beforeSnap = await getDoc(analyticsRef)
      console.log(`📊 Before - Document exists: ${beforeSnap.exists()}`)

      if (beforeSnap.exists()) {
        const beforeData = beforeSnap.data() as AnalyticsData
        console.log(`📊 Before - totalClicks: ${beforeData.totalClicks}`)
      }

      // ✅ SIMPLIFIED: Only update totalClicks and lastClickAt (no clickEvents)
      await updateDoc(analyticsRef, {
        totalClicks: increment(1),
        lastClickAt: serverTimestamp(), // ✅ This is OK for direct field update
        // ✅ REMOVED: clickEvents array update (redundant)
      })

      console.log(`✅ Direct increment completed`)

      // Verify the result
      const afterSnap = await getDoc(analyticsRef)
      if (afterSnap.exists()) {
        const afterData = afterSnap.data() as AnalyticsData
        console.log(`📊 After - totalClicks: ${afterData.totalClicks}`)
        setResult(`✅ Success! totalClicks incremented to: ${afterData.totalClicks}`)
        await fetchAnalyticsData(shortCode)
      } else {
        setResult("❌ Document not found after increment")
      }
    } catch (error) {
      console.error("❌ Direct increment error:", error)
      setResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const testRedirectAPI = async () => {
    if (!shortCode) {
      setResult("Please enter a short code")
      return
    }

    setLoading(true)
    try {
      console.log(`🧪 Testing redirect API for: ${shortCode}`)

      const response = await fetch(`/api/redirect/${shortCode}`)
      const data = await response.json()

      console.log(`📡 API Response:`, data)

      if (response.ok) {
        setResult(
          `✅ API Test Result\nStatus: ${response.status}\nSuccess: ${data.success ? "Yes" : "No"}\nRedirect URL: ${data.redirectUrl}`,
        )

        // Refresh analytics data after API call
        setTimeout(async () => {
          await fetchAnalyticsData(shortCode)
        }, 1000)
      } else {
        setResult(`❌ API Error\nStatus: ${response.status}\nError: ${data.error}`)
      }
    } catch (error) {
      console.error("❌ API test error:", error)
      setResult(`❌ API Test Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshAnalytics = async () => {
    if (!shortCode) return

    setLoading(true)
    try {
      await fetchAnalyticsData(shortCode)
      setResult("📊 Analytics data refreshed")
    } catch (error) {
      setResult(`❌ Refresh error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Debug totalClicks Issue</CardTitle>
          <CardDescription>
            Test if totalClicks increment is working properly in the analytics collection (simplified - no clickEvents
            array)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="shortCode">Short Code</Label>
            <Input
              id="shortCode"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              placeholder="Enter short code (e.g., 6yRi4j)"
            />
          </div>

          <div className="flex gap-4 flex-wrap">
            <Button onClick={testDirectIncrement} disabled={loading || !shortCode} variant="default">
              {loading ? "Testing..." : "Test Direct Increment"}
            </Button>

            <Button onClick={testRedirectAPI} disabled={loading || !shortCode} variant="secondary">
              {loading ? "Testing..." : "Test Redirect API"}
            </Button>

            <Button onClick={refreshAnalytics} disabled={loading || !shortCode} variant="outline">
              {loading ? "Refreshing..." : "Refresh Analytics"}
            </Button>
          </div>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-3 rounded">{result}</pre>
              </CardContent>
            </Card>
          )}

          <Separator />

          {analyticsData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Current Analytics Data (Simplified)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Short Code:</strong> {analyticsData.shortCode}
                  </div>
                  <div>
                    <strong>Total Clicks:</strong> {analyticsData.totalClicks}
                  </div>
                  <div>
                    <strong>Created At:</strong> {analyticsData.createdAt?.toDate?.()?.toLocaleString() || "N/A"}
                  </div>
                  <div>
                    <strong>Last Click At:</strong> {analyticsData.lastClickAt?.toDate?.()?.toLocaleString() || "N/A"}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-green-50 rounded">
                  <p className="text-sm text-green-800">
                    ✅ <strong>Simplified Analytics:</strong> The clickEvents array has been removed from analytics
                    documents. Detailed click data is now stored only in the shortcode_clicks subcollection, eliminating
                    redundancy.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🔍 Debug Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <strong>1. Test Direct Increment:</strong> This directly calls updateDoc with increment(1) to see if the
                basic operation works (no clickEvents array).
              </p>
              <p>
                <strong>2. Test Redirect API:</strong> This calls the /api/redirect/[shortCode] endpoint to test the
                full flow (simplified version).
              </p>
              <p>
                <strong>3. Check Browser Console:</strong> Look for detailed logs about what's happening during the
                operations.
              </p>
              <p>
                <strong>4. Check Firestore Console:</strong> Verify the changes are actually being written to the
                database.
              </p>
              <p>
                <strong>5. Simplified Structure:</strong> Analytics documents now only contain totalClicks, createdAt,
                and lastClickAt. Detailed click data is in shortcode_clicks subcollection.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
