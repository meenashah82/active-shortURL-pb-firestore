import { type NextRequest, NextResponse } from "next/server"
import { getUnifiedUrlData, trackClick } from "@/lib/analytics-unified"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 })
    }

    const urlData = await getUnifiedUrlData(shortCode)

    if (!urlData || !urlData.isActive) {
      return NextResponse.json({ error: "URL not found or inactive" }, { status: 404 })
    }

    // Track the click with unified analytics
    const clickData = {
      userAgent: request.headers.get("user-agent") || undefined,
      referer: request.headers.get("referer") || undefined,
      ip: request.ip || request.headers.get("x-forwarded-for") || undefined,
    }

    await trackClick(shortCode, clickData)

    // Redirect to the original URL
    return NextResponse.redirect(urlData.originalUrl, { status: 302 })
  } catch (error) {
    console.error("Error processing redirect:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
