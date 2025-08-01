import { type NextRequest, NextResponse } from "next/server"
import { getUrlData } from "@/lib/analytics-unified"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 })
    }

    // Get URL data with embedded analytics
    const urlData = await getUrlData(shortCode)

    if (!urlData) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    // Return analytics data from the unified document
    const analyticsData = {
      shortCode: urlData.shortCode,
      originalUrl: urlData.originalUrl,
      totalClicks: urlData.totalClicks || 0,
      lastClickAt: urlData.lastClickAt,
      clickEvents: urlData.clickEvents || [],
      createdAt: urlData.createdAt,
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
