import { type NextRequest, NextResponse } from "next/server"
import { getUrlWithAnalytics } from "@/lib/analytics-unified"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  const { shortCode } = params

  try {
    // Get unified URL data with embedded analytics
    const result = await getUrlWithAnalytics(shortCode)

    if (!result.url) {
      return NextResponse.json({ error: "Short code not found" }, { status: 404 })
    }

    return NextResponse.json({
      urlData: {
        originalUrl: result.url.originalUrl,
        shortCode: result.url.shortCode,
        createdAt: result.url.createdAt,
        clicks: result.url.totalClicks || 0,
      },
      analyticsData: {
        clicks: result.url.totalClicks || 0,
        clickHistory: result.url.clickEvents || [],
        createdAt: result.url.createdAt,
      },
    })
  } catch (error) {
    console.error("Error loading unified analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
