import { type NextRequest, NextResponse } from "next/server"
import { getUrlData, recordClick } from "@/lib/analytics-clean"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params
    console.log(`🔍 Looking up shortCode: ${shortCode}`)

    // Get URL data using the clean analytics system
    const urlData = await getUrlData(shortCode)

    if (!urlData) {
      console.log(`❌ URL not found for shortCode: ${shortCode}`)
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    console.log(`✅ Found URL: ${urlData.originalUrl}`)

    // Record the click
    const userAgent = request.headers.get("user-agent") || ""
    const referer = request.headers.get("referer") || ""
    const ip = request.ip || request.headers.get("x-forwarded-for") || ""

    await recordClick(shortCode, userAgent, referer, ip)

    // Return redirect URL for client-side redirect
    return NextResponse.json({ redirectUrl: urlData.originalUrl })
  } catch (error) {
    console.error("❌ Error in redirect:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
