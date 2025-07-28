import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc, runTransaction, serverTimestamp, arrayUnion, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface UrlData {
  originalUrl: string
  shortCode: string
  createdAt: any
  clicks?: number // Optional for backward compatibility
  isActive: boolean
  expiresAt: any
}

interface DetailedClickEvent {
  id: string
  timestamp: any
  method: string
  url: string
  httpVersion: string
  host: string
  userAgent: string
  contentType: string
  accept: string
  authorization: string
  cookie: string
  referer: string
  contentLength: string
  connection: string
  body: string
  queryParameters: Record<string, string>
  pathParameters: Record<string, string>
  headers: Record<string, string>
  ip: string
  sessionId: string
  clickSource: "direct"
  realTime: boolean
}

interface AnalyticsData {
  shortCode: string
  totalClicks: number
  createdAt: any
  lastClickAt?: any
  clickEvents: DetailedClickEvent[]
}

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  const { shortCode } = params

  try {
    console.log(`🔗 Processing redirect for: ${shortCode}`)

    // Get URL data from Firestore
    const urlRef = doc(db, "urls", shortCode)
    const urlSnap = await getDoc(urlRef)

    if (!urlSnap.exists()) {
      console.log(`❌ Short code not found in urls collection: ${shortCode}`)
      return NextResponse.json({ error: "Short code not found" }, { status: 404 })
    }

    const urlData = urlSnap.data() as UrlData
    console.log(`📄 URL data found:`, {
      shortCode,
      originalUrl: urlData.originalUrl,
      isActive: urlData.isActive,
      hasExpiry: !!urlData.expiresAt,
    })

    // Check if URL has expired or is inactive
    if (!urlData.isActive) {
      console.log(`❌ URL is inactive: ${shortCode}`)
      return NextResponse.json({ error: "Short code inactive" }, { status: 404 })
    }

    if (urlData.expiresAt && urlData.expiresAt.toDate() < new Date()) {
      console.log(`❌ URL expired: ${shortCode}`)
      return NextResponse.json({ error: "Short code expired" }, { status: 404 })
    }

    // Validate that we have the required data
    if (!urlData.originalUrl) {
      console.error("❌ No originalUrl found in data:", urlData)
      return NextResponse.json({ error: "Invalid URL data" }, { status: 500 })
    }

    // Ensure the URL has a protocol
    let redirectUrl = urlData.originalUrl
    if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://")) {
      redirectUrl = "https://" + redirectUrl
    }

    console.log(`✅ Redirect URL prepared: ${redirectUrl}`)

    // Capture detailed request information
    const detailedRequestInfo = captureDetailedRequestInfo(request, shortCode)

    // Record the click analytics (don't let this fail the redirect)
    try {
      console.log(`📊 Recording detailed click analytics for: ${shortCode}`)
      await recordDetailedClickAnalytics(shortCode, detailedRequestInfo)
      console.log(`✅ Detailed click analytics recorded successfully`)
    } catch (analyticsError) {
      console.error("⚠️ Analytics recording failed (but continuing redirect):", analyticsError)
    }

    console.log(`🚀 Redirect successful for: ${shortCode}`)

    // Return the redirect URL for client-side redirection
    return NextResponse.json({
      redirectUrl,
      success: true,
      shortCode,
    })
  } catch (error) {
    console.error("❌ Redirect error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

function captureDetailedRequestInfo(request: NextRequest, shortCode: string): DetailedClickEvent {
  // Extract all headers
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })

  // Extract query parameters
  const url = new URL(request.url)
  const queryParameters: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    queryParameters[key] = value
  })

  // Extract path parameters (from the URL path)
  const pathParameters: Record<string, string> = {
    shortCode: shortCode,
  }

  // Get IP address
  const forwardedFor = request.headers.get("x-forwarded-for") || ""
  const realIp = request.headers.get("x-real-ip") || ""
  const ip = forwardedFor.split(",")[0]?.trim() || realIp || request.ip || "unknown"

  // Create detailed click event
  const detailedClickEvent: DetailedClickEvent = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: serverTimestamp(),
    method: request.method || "GET",
    url: request.url || "",
    httpVersion: "HTTP/1.1", // Default, as Next.js doesn't expose this directly
    host: request.headers.get("host") || "",
    userAgent: request.headers.get("user-agent") || "",
    contentType: request.headers.get("content-type") || "",
    accept: request.headers.get("accept") || "",
    authorization: request.headers.get("authorization") || "",
    cookie: request.headers.get("cookie") || "",
    referer: request.headers.get("referer") || "",
    contentLength: request.headers.get("content-length") || "",
    connection: request.headers.get("connection") || "",
    body: "", // GET requests typically don't have body
    queryParameters,
    pathParameters,
    headers,
    ip,
    sessionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    clickSource: "direct",
    realTime: true,
  }

  return detailedClickEvent
}

async function recordDetailedClickAnalytics(shortCode: string, clickEvent: DetailedClickEvent) {
  try {
    const analyticsRef = doc(db, "analytics", shortCode)

    console.log(`🔄 Recording detailed click for ${shortCode} - Starting transaction`)

    // Use a more robust transaction approach
    await runTransaction(db, async (transaction) => {
      const analyticsDoc = await transaction.get(analyticsRef)

      if (analyticsDoc.exists()) {
        const currentData = analyticsDoc.data()
        const currentClicks = currentData.totalClicks || 0
        const newClickCount = currentClicks + 1

        console.log(`📈 Incrementing totalClicks: ${currentClicks} → ${newClickCount}`)

        // Update with explicit new value and detailed click event
        transaction.update(analyticsRef, {
          totalClicks: newClickCount,
          lastClickAt: serverTimestamp(),
          clickEvents: arrayUnion(clickEvent),
        })
      } else {
        console.log(`📝 Creating new analytics document for: ${shortCode}`)

        // Create new analytics document with detailed tracking
        transaction.set(analyticsRef, {
          shortCode,
          totalClicks: 1,
          createdAt: serverTimestamp(),
          lastClickAt: serverTimestamp(),
          clickEvents: [clickEvent],
        })
      }
    })

    console.log(`✅ Detailed click analytics recorded successfully for: ${shortCode}`)
  } catch (error) {
    console.error(`❌ Error recording detailed analytics for ${shortCode}:`, error)

    // Fallback: try a simple update without transaction
    try {
      console.log(`🔄 Attempting fallback update for ${shortCode}`)
      const analyticsRef = doc(db, "analytics", shortCode)
      const analyticsSnap = await getDoc(analyticsRef)

      if (analyticsSnap.exists()) {
        const currentData = analyticsSnap.data()
        const newCount = (currentData.totalClicks || 0) + 1

        await updateDoc(analyticsRef, {
          totalClicks: newCount,
          lastClickAt: serverTimestamp(),
        })

        console.log(`✅ Fallback update successful: ${newCount}`)
      }
    } catch (fallbackError) {
      console.error(`❌ Fallback also failed:`, fallbackError)
    }

    throw error
  }
}
