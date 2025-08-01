import { type NextRequest, NextResponse } from "next/server"
import { getUrlData, recordClick } from "@/lib/analytics-clean"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    console.log(`🔍 Looking up shortCode: ${shortCode}`)

    // Get URL data from clean analytics system
    const urlData = await getUrlData(shortCode)

    if (!urlData) {
      console.log(`❌ URL not found for shortCode: ${shortCode}`)
      return NextResponse.json({ error: "Link not found" }, { status: 404 })
    }

    console.log(`✅ Found URL: ${urlData.originalUrl}`)

    // Record the click in analytics
    await recordClick(shortCode, {
      timestamp: new Date(),
      userAgent: request.headers.get("user-agent") || "Unknown",
      referer: request.headers.get("referer") || "Direct",
      ip: request.ip || request.headers.get("x-forwarded-for") || "Unknown",
    })

    console.log(`📊 Click recorded for ${shortCode}`)

    // Return redirect URL for client-side redirect
    return NextResponse.json({ redirectUrl: urlData.originalUrl })
  } catch (error) {
    console.error("❌ Redirect error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
