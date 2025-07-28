import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc, runTransaction, serverTimestamp, arrayUnion, updateDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface UrlData {
  originalUrl: string
  shortCode: string
  createdAt: any
  clicks?: number // Optional for backward compatibility
  isActive: boolean
  expiresAt: any
}

interface AnalyticsData {
  shortCode: string
  totalClicks: number
  createdAt: any
  lastClickAt?: any
  clickEvents: any[]
}

interface IndividualClickData {
  id: string
  timestamp: any
  shortCode: string
  userAgent?: string
  referer?: string
  ip?: string
  sessionId?: string
  clickSource?: "direct" | "analytics_page" | "test"
  method?: string
  url?: string
  httpVersion?: string
  host?: string
  contentType?: string
  accept?: string
  authorization?: string
  cookie?: string
  contentLength?: string
  connection?: string
  body?: string
  queryParameters?: Record<string, string>
  pathParameters?: Record<string, string>
  headers?: Record<string, string>
  geolocation?: {
    country?: string
    region?: string
    city?: string
    timezone?: string
  }
  device?: {
    type?: string
    browser?: string
    os?: string
    isMobile?: boolean
  }
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

    // Get headers for analytics
    const userAgent = request.headers.get("user-agent") || ""
    const referer = request.headers.get("referer") || ""
    const forwardedFor = request.headers.get("x-forwarded-for") || ""
    const ip = forwardedFor.split(",")[0]?.trim() || ""

    // Record the click analytics (don't let this fail the redirect)
    try {
      console.log(`📊 Recording click analytics for: ${shortCode}`)
      await recordClickAnalytics(shortCode, request)
      console.log(`✅ Click analytics recorded successfully`)
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

async function recordClickAnalytics(shortCode: string, request: NextRequest) {
  try {
    const analyticsRef = doc(db, "analytics", shortCode)

    // Extract comprehensive request information
    const userAgent = request.headers.get("user-agent") || ""
    const referer = request.headers.get("referer") || ""
    const forwardedFor = request.headers.get("x-forwarded-for") || ""
    const ip = forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || ""
    const host = request.headers.get("host") || ""
    const accept = request.headers.get("accept") || ""
    const contentType = request.headers.get("content-type") || ""
    const authorization = request.headers.get("authorization") || ""
    const cookie = request.headers.get("cookie") || ""
    const contentLength = request.headers.get("content-length") || ""
    const connection = request.headers.get("connection") || ""

    // Parse URL for query parameters
    const url = new URL(request.url)
    const queryParameters: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      queryParameters[key] = value
    })

    // Extract all headers
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Parse user agent for device information
    const deviceInfo = parseUserAgent(userAgent)

    // Create unique click ID
    const clickId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create comprehensive click event for analytics collection (existing functionality)
    const clickEvent = {
      id: clickId,
      timestamp: serverTimestamp(),
      userAgent: userAgent.substring(0, 200),
      referer: referer.substring(0, 200),
      ip: ip.substring(0, 15),
      sessionId: sessionId,
      clickSource: "direct" as const,
      realTime: true,
    }

    // Create detailed individual click data for shortcode_clicks subcollection
    const individualClickData: IndividualClickData = {
      id: clickId,
      timestamp: serverTimestamp(),
      shortCode: shortCode,
      userAgent: userAgent,
      referer: referer,
      ip: ip,
      sessionId: sessionId,
      clickSource: "direct",
      method: request.method,
      url: request.url,
      httpVersion: "HTTP/1.1", // Next.js doesn't expose this directly
      host: host,
      contentType: contentType,
      accept: accept,
      authorization: authorization ? "[REDACTED]" : "", // Security: redact auth tokens
      cookie: cookie ? "[REDACTED]" : "", // Security: redact cookies
      contentLength: contentLength,
      connection: connection,
      body: "", // GET requests typically don't have body
      queryParameters: queryParameters,
      pathParameters: { shortCode: shortCode },
      headers: {
        ...headers,
        authorization: headers.authorization ? "[REDACTED]" : undefined,
        cookie: headers.cookie ? "[REDACTED]" : undefined,
      },
      device: deviceInfo,
    }

    console.log(`🔄 Recording click for ${shortCode} - Starting improved transaction`)

    // Use transaction to update both analytics and create individual click record
    await runTransaction(db, async (transaction) => {
      const analyticsDoc = await transaction.get(analyticsRef)

      if (analyticsDoc.exists()) {
        const currentData = analyticsDoc.data()
        const currentClicks = currentData.totalClicks || 0
        const newClickCount = currentClicks + 1

        console.log(`📈 Incrementing totalClicks: ${currentClicks} → ${newClickCount}`)

        // Update analytics with explicit new value instead of increment()
        transaction.update(analyticsRef, {
          totalClicks: newClickCount,
          lastClickAt: serverTimestamp(),
          clickEvents: arrayUnion(clickEvent),
        })
      } else {
        console.log(`📝 Creating new analytics document for: ${shortCode}`)

        // Create new analytics document
        transaction.set(analyticsRef, {
          shortCode,
          totalClicks: 1,
          createdAt: serverTimestamp(),
          lastClickAt: serverTimestamp(),
          clickEvents: [clickEvent],
        })
      }

      // Create individual click record in shortcode_clicks subcollection
      const shortcodeClicksRef = collection(db, "clicks", shortCode, "shortcode_clicks")
      const individualClickRef = doc(shortcodeClicksRef, clickId)
      transaction.set(individualClickRef, individualClickData)
    })

    console.log(`✅ Click analytics and individual click record created successfully for: ${shortCode}`)
  } catch (error) {
    console.error(`❌ Error recording analytics for ${shortCode}:`, error)

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

function parseUserAgent(userAgent: string) {
  // Simple user agent parsing - you could use a library like 'ua-parser-js' for more accuracy
  const device = {
    type: "desktop",
    browser: "Unknown",
    os: "Unknown",
    isMobile: false,
  }

  if (userAgent) {
    // Detect mobile
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      device.isMobile = true
      device.type = "mobile"
    }

    // Detect tablet
    if (/iPad|Android(?!.*Mobile)/i.test(userAgent)) {
      device.type = "tablet"
    }

    // Detect browser
    if (userAgent.includes("Chrome")) device.browser = "Chrome"
    else if (userAgent.includes("Firefox")) device.browser = "Firefox"
    else if (userAgent.includes("Safari")) device.browser = "Safari"
    else if (userAgent.includes("Edge")) device.browser = "Edge"
    else if (userAgent.includes("Opera")) device.browser = "Opera"

    // Detect OS
    if (userAgent.includes("Windows")) device.os = "Windows"
    else if (userAgent.includes("Mac OS")) device.os = "macOS"
    else if (userAgent.includes("Linux")) device.os = "Linux"
    else if (userAgent.includes("Android")) device.os = "Android"
    else if (userAgent.includes("iOS")) device.os = "iOS"
  }

  return device
}
