import { type NextRequest, NextResponse } from "next/server"
import { getUnifiedUrlData } from "@/lib/analytics-unified"
import { verifyAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { shortCode } = params

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 })
    }

    const urlData = await getUnifiedUrlData(shortCode)

    if (!urlData) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    // Return analytics data from the unified URL document
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
