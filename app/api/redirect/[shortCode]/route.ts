import { type NextRequest, NextResponse } from "next/server"
import { getUrlWithAnalytics, trackClickUnified } from "@/lib/analytics-unified"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  const { shortCode } = params

  try {
    console.log(`🔗 Processing redirect for: ${shortCode}`)

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 })
    }

    // Get URL data from unified structure
    const urlData = await getUrlWithAnalytics(shortCode)

    if (!urlData || !urlData.isActive) {
      console.log(`❌ URL not found or inactive: ${shortCode}`)
      return NextResponse.json({ error: "URL not found or inactive" }, { status: 404 })
    }

    console.log(`📄 URL data found for: ${shortCode}`)

    // Check if URL has expired
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

    // Track the click with unified analytics
    const userAgent = request.headers.get("user-agent") || undefined
    const referer = request.headers.get("referer") || undefined
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.ip || undefined

    await trackClickUnified(shortCode, {
      userAgent,
      referer,
      ip,
    })

    console.log(`✅ Click analytics recorded successfully`)

    console.log(`🚀 Redirect successful for: ${shortCode}`)

    // Redirect to the original URL
    return NextResponse.redirect(redirectUrl, 302)
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

// Functionality moved to analytics-unified module
// async function recordClickAnalyticsUnified(shortCode: string, request: NextRequest) { ... }

// Functionality moved to analytics-unified module
// function parseUserAgent(userAgent: string) { ... }
