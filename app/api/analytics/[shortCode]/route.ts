import { type NextRequest, NextResponse } from "next/server"
import { getUnifiedAnalytics } from "@/lib/analytics-unified"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 })
    }

    const analytics = await getUnifiedAnalytics(shortCode)

    if (!analytics) {
      return NextResponse.json({ error: "Analytics not found" }, { status: 404 })
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
