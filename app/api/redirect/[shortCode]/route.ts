import { type NextRequest, NextResponse } from "next/server"
import { trackClick, getUrlByShortCode } from "@/lib/analytics-unified"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const shortCode = params.shortCode

    // Get URL data
    const urlData = await getUrlByShortCode(shortCode)

    if (!urlData || !urlData.isActive) {
      return NextResponse.redirect(new URL("/not-found", request.url))
    }

    // Track the click
    const userAgent = request.headers.get("user-agent") || ""
    const referer = request.headers.get("referer") || ""
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

    await trackClick(shortCode, {
      userAgent,
      referer,
      ip,
      timestamp: new Date(),
    })

    // Redirect to original URL
    return NextResponse.redirect(urlData.originalUrl)
  } catch (error) {
    console.error("Redirect error:", error)
    return NextResponse.redirect(new URL("/not-found", request.url))
  }
}
