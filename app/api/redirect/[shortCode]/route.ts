import { type NextRequest, NextResponse } from "next/server"
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  collection,
  setDoc,
  increment,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

interface UrlData {
  originalUrl: string
  shortCode: string
  createdAt: any
  clicks?: number
  isActive: boolean
  expiresAt: any
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
    // Get URL data from Firestore
    const urlRef = doc(db, "urls", shortCode)
    const urlSnap = await getDoc(urlRef)

    if (!urlSnap.exists()) {
      return NextResponse.json({ error: "Short code not found" }, { status: 404 })
    }

    const urlData = urlSnap.data() as UrlData

    // Check if URL has expired or is inactive
    if (!urlData.isActive) {
      return NextResponse.json({ error: "Short code inactive" }, { status: 404 })
    }

    if (urlData.expiresAt && urlData.expiresAt.toDate() < new Date()) {
      return NextResponse.json({ error: "Short code expired" }, { status: 404 })
    }

    if (!urlData.originalUrl) {
      return NextResponse.json({ error: "Invalid URL data" }, { status: 500 })
    }

    // Ensure the URL has a protocol
    let redirectUrl = urlData.originalUrl
    if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://")) {
      redirectUrl = "https://" + redirectUrl
    }

    // Record the click analytics
    await recordClickAnalytics(shortCode, request)

    // Return actual HTTP redirect response
    return NextResponse.redirect(redirectUrl, { status: 302 })
  } catch (error) {
    console.error("Redirect error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function recordClickAnalytics(shortCode: string, request: NextRequest) {
  try {
    // Extract request information
    const userAgent = request.headers.get("user-agent") || ""
    const referer = request.headers.get("referer") || ""
    const forwardedFor = request.headers.get("x-forwarded-for") || ""
    const ip = forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || ""
    const host = request.headers.get("host") || ""
    const accept = request.headers.get("accept") || ""

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

    // Create unique click ID for EVERY click
    const clickId = `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

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
      httpVersion: "HTTP/1.1",
      host: host,
      contentType: request.headers.get("content-type") || "",
      accept: accept,
      authorization: request.headers.get("authorization") ? "[REDACTED]" : "",
      cookie: request.headers.get("cookie") ? "[REDACTED]" : "",
      contentLength: request.headers.get("content-length") || "",
      connection: request.headers.get("connection") || "",
      body: "",
      queryParameters: queryParameters,
      pathParameters: { shortCode: shortCode },
      headers: {
        ...headers,
        authorization: headers.authorization ? "[REDACTED]" : undefined,
        cookie: headers.cookie ? "[REDACTED]" : undefined,
      },
      device: deviceInfo,
    }

    // Ensure the parent clicks document exists
    const clicksRef = doc(db, "clicks", shortCode)
    const clicksSnap = await getDoc(clicksRef)

    if (!clicksSnap.exists()) {
      await setDoc(clicksRef, {
        shortCode: shortCode,
        createdAt: serverTimestamp(),
        isActive: true,
      })
    }

    // Create the individual click document
    const shortcodeClicksRef = collection(db, "clicks", shortCode, "shortcode_clicks")
    const individualClickRef = doc(shortcodeClicksRef, clickId)
    await setDoc(individualClickRef, individualClickData)

    // Create click event for analytics
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

    // Update both URLs and analytics collections
    const urlRef = doc(db, "urls", shortCode)
    const analyticsRef = doc(db, "analytics", shortCode)

    await runTransaction(db, async (transaction) => {
      const urlDoc = await transaction.get(urlRef)
      const analyticsDoc = await transaction.get(analyticsRef)

      // Update URLs collection
      if (urlDoc.exists()) {
        transaction.update(urlRef, {
          clicks: increment(1),
          lastClickAt: serverTimestamp(),
        })
      }

      // Update analytics collection
      if (analyticsDoc.exists()) {
        transaction.update(analyticsRef, {
          totalClicks: increment(1),
          lastClickAt: serverTimestamp(),
          clickEvents: arrayUnion(clickEvent),
        })
      } else {
        transaction.set(analyticsRef, {
          shortCode,
          totalClicks: 1,
          createdAt: serverTimestamp(),
          lastClickAt: serverTimestamp(),
          clickEvents: [clickEvent],
        })
      }
    })
  } catch (error) {
    console.error(`Error in recordClickAnalytics for ${shortCode}:`, error)
    throw error
  }
}

function parseUserAgent(userAgent: string) {
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
