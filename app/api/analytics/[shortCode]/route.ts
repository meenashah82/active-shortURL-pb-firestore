import { type NextRequest, NextResponse } from "next/server"
import { getUrlWithAnalytics } from "@/lib/analytics-unified"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 })
    }

    const urlData = await getUrlWithAnalytics(shortCode)

    if (!urlData) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    // Return analytics data from unified structure
    return NextResponse.json({
      shortCode: urlData.shortCode,
      originalUrl: urlData.originalUrl,
      totalClicks: urlData.totalClicks,
      lastClickAt: urlData.lastClickAt,
      clickEvents: urlData.clickEvents,
      createdAt: urlData.createdAt,
      isActive: urlData.isActive,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
