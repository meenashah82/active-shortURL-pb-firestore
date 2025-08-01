import { type NextRequest, NextResponse } from "next/server"
import { getUrlWithAnalytics, trackClickUnified } from "@/lib/analytics-unified"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 })
    }

    const urlData = await getUrlWithAnalytics(shortCode)

    if (!urlData || !urlData.isActive) {
      return NextResponse.json({ error: "URL not found or inactive" }, { status: 404 })
    }

    // Track the click with unified analytics
    const userAgent = request.headers.get("user-agent") || ""
    const referer = request.headers.get("referer") || ""
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

    await trackClickUnified(shortCode, {
      userAgent,
      referer,
      ip,
    })

    // Redirect to the original URL
    return NextResponse.redirect(urlData.originalUrl, { status: 302 })
  } catch (error) {
    console.error("Error in redirect:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
