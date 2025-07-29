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
    console.log(`📄 URL data found for: ${shortCode}`)

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

    // Record the click analytics - SIMPLIFIED VERSION
    try {
      console.log(`📊 Recording click analytics for: ${shortCode}`)
      await recordClickAnalyticsSimplified(shortCode, request)
      console.log(`✅ Click analytics recorded successfully`)
    } catch (analyticsError) {
      console.error("⚠️ Analytics recording failed:", analyticsError)
    }

    console.log(`🚀 Redirect successful for: ${shortCode}`)

    // Return JSON response with redirect URL
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
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function recordClickAnalyticsSimplified(shortCode: string, request: NextRequest) {
  try {
    console.log(`🔄 SIMPLIFIED: Starting click recording for ${shortCode}`)

    // Create unique click ID
    const clickId = `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log(`📝 Generated click ID: ${clickId}`)

    // STEP 1: Create individual click document (MANDATORY)
    const shortcodeClicksRef = collection(db, "clicks", shortCode, "shortcode_clicks")
    const individualClickRef = doc(shortcodeClicksRef, clickId)

    const individualClickData: IndividualClickData = {
      id: clickId,
      timestamp: serverTimestamp(),
      shortCode: shortCode,
      userAgent: request.headers.get("user-agent") || "",
      referer: request.headers.get("referer") || "",
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
      sessionId: sessionId,
      clickSource: "direct",
      method: request.method,
      url: request.url,
      device: parseUserAgent(request.headers.get("user-agent") || ""),
    }

    // Ensure parent clicks document exists
    const clicksRef = doc(db, "clicks", shortCode)
    const clicksSnap = await getDoc(clicksRef)

    if (!clicksSnap.exists()) {
      console.log(`📝 Creating parent clicks document for: ${shortCode}`)
      await setDoc(clicksRef, {
        shortCode: shortCode,
        createdAt: serverTimestamp(),
        isActive: true,
      })
    }

    // Create individual click document
    await setDoc(individualClickRef, individualClickData)
    console.log(`✅ Individual click document created: ${clickId}`)

    // STEP 2: Update analytics with SIMPLEST possible approach
    console.log(`🔄 SIMPLIFIED: Updating analytics for ${shortCode}`)

    const analyticsRef = doc(db, "analytics", shortCode)

    // Check if analytics document exists first
    const analyticsSnap = await getDoc(analyticsRef)
    console.log(`📊 Analytics document exists: ${analyticsSnap.exists()}`)

    const clickEvent = {
      id: clickId,
      timestamp: serverTimestamp(),
      userAgent: (request.headers.get("user-agent") || "").substring(0, 200),
      referer: (request.headers.get("referer") || "").substring(0, 200),
      ip: (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "").substring(0, 15),
      sessionId: sessionId,
      clickSource: "direct" as const,
    }

    if (analyticsSnap.exists()) {
      console.log(`📈 SIMPLIFIED: Analytics exists, using simple transaction`)
      const currentData = analyticsSnap.data() as AnalyticsData
      console.log(`📊 Current totalClicks: ${currentData.totalClicks || 0}`)

      // Use the simplest possible transaction
      await runTransaction(db, async (transaction) => {
        console.log(`🔄 Inside simple transaction`)

        // Re-read the document inside the transaction
        const freshDoc = await transaction.get(analyticsRef)
        if (freshDoc.exists()) {
          const freshData = freshDoc.data() as AnalyticsData
          console.log(`📊 Fresh totalClicks in transaction: ${freshData.totalClicks || 0}`)

          transaction.update(analyticsRef, {
            totalClicks: increment(1),
            lastClickAt: serverTimestamp(),
            clickEvents: arrayUnion(clickEvent),
          })
          console.log(`✅ Simple update queued`)
        }
      })
      console.log(`✅ Simple transaction completed`)
    } else {
      console.log(`📝 SIMPLIFIED: Creating new analytics document`)
      await setDoc(analyticsRef, {
        shortCode,
        totalClicks: 1,
        createdAt: serverTimestamp(),
        lastClickAt: serverTimestamp(),
        clickEvents: [clickEvent],
      })
      console.log(`✅ New analytics document created`)
    }

    // VERIFICATION: Check if the update worked
    console.log(`🔍 VERIFICATION: Checking analytics after update`)
    const verifySnap = await getDoc(analyticsRef)
    if (verifySnap.exists()) {
      const verifyData = verifySnap.data() as AnalyticsData
      console.log(`✅ VERIFICATION SUCCESS: totalClicks is now ${verifyData.totalClicks}`)
    } else {
      console.log(`❌ VERIFICATION FAILED: Analytics document missing`)
    }

    console.log(`🎯 SIMPLIFIED: Click recording completed for ${shortCode}`)
  } catch (error) {
    console.error(`❌ SIMPLIFIED: Error in recordClickAnalytics for ${shortCode}:`, error)
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
