import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import { getUrlData, getClickHistory } from "@/lib/analytics-clean"

async function analyticsHandler(request: NextRequest, user: any, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    console.log(`📊 Analytics API: Fetching data for shortCode: ${shortCode}`)

    // Get URL document with embedded analytics
    const urlData = await getUrlData(shortCode)

    if (!urlData) {
      console.log(`❌ Analytics API: Short URL not found: ${shortCode}`)
      return NextResponse.json({ error: "Short URL not found" }, { status: 404 })
    }

    console.log(`✅ Analytics API: Found URL data for ${shortCode}`, {
      originalUrl: urlData.originalUrl,
      totalClicks: urlData.totalClicks,
      isActive: urlData.isActive
    })

    // Get click history from subcollection
    const clickHistory = await getClickHistory(shortCode, 100)

    // Return analytics data
    return NextResponse.json({
      shortCode,
      originalUrl: urlData.originalUrl,
      totalClicks: urlData.totalClicks || 0,
      lastClickAt: urlData.lastClickAt,
      clickHistory: clickHistory,
      createdAt: urlData.createdAt,
      isActive: urlData.isActive,
    })
  } catch (error) {
    console.error("❌ Analytics API: Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(analyticsHandler)
