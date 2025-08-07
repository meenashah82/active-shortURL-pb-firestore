import { type NextRequest, NextResponse } from "next/server"
import { getUrlData, recordClick } from "@/lib/analytics-clean"

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const { shortCode } = params

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 })
    }

    console.log(`🔍 API redirect for: ${shortCode}`)

    // Get URL data
    const urlData = await getUrlData(shortCode)

    if (!urlData) {
      console.log(`❌ Short code not found: ${shortCode}`)
      return NextResponse.json({ error: "Short URL not found" }, { status: 404 })
    }

    console.log(`✅ Found URL: ${shortCode} -> ${urlData.originalUrl}`)

    // Extract all headers for detailed click tracking
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Record the click with all headers
    const userAgent = request.headers.get("user-agent") || "Unknown"
    const referer = request.headers.get("referer") || "Direct"
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0] || realIp || "Unknown"

    // Record click asynchronously (don't block redirect)
    recordClick(shortCode, userAgent, referer, ip, headers).catch(error => {
      console.error(`❌ Failed to record click for ${shortCode}:`, error)
    })

    // Ensure URL has protocol
    let targetUrl = urlData.originalUrl.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    console.log(`🚀 Redirecting ${shortCode} to: ${targetUrl}`)

    // Redirect to the original URL
    return NextResponse.redirect(targetUrl, { status: 302 })
  } catch (error) {
    console.error("❌ Error in API redirect:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
