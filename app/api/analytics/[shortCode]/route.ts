import { type NextRequest, NextResponse } from "next/server"
import { getAnalytics } from "@/lib/analytics-unified"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const shortCode = params.shortCode
    const analytics = await getAnalytics(shortCode)

    if (!analytics) {
      return NextResponse.json({ error: "Analytics not found" }, { status: 404 })
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
