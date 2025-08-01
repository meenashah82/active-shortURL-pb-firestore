import { type NextRequest, NextResponse } from "next/server"
import { getUrlData, recordClick } from "@/lib/analytics-clean"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params
    console.log(`🔍 Processing redirect request for shortCode: ${shortCode}`)

    // Get URL data using the clean analytics system
    const urlData = await getUrlData(shortCode)

    if (!urlData) {
      console.log(`❌ URL not found for shortCode: ${shortCode}`)
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    console.log(`✅ Found URL: ${urlData.originalUrl} for shortCode: ${shortCode}`)

    // Extract all headers for detailed click tracking
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Record the click with detailed header information
    const userAgent = request.headers.get("user-agent") || ""
    const referer = request.headers.get("referer") || ""
    const ip = request.ip || request.headers.get("x-forwarded-for") || ""

    console.log(`🔄 Recording click for shortCode: ${shortCode}`)

    try {
      // Record click - this will create a new document in urls/{shortCode}/clicks/{clickId}
      await recordClick(shortCode, userAgent, referer, ip, headers)
      console.log(`✅ Click recorded successfully for shortCode: ${shortCode}`)
    } catch (clickError) {
      // Don't fail the redirect if click recording fails
      console.error(`⚠️ Click recording failed for shortCode: ${shortCode}`, clickError)
    }

    // Return redirect URL for client-side redirect
    return NextResponse.json({ redirectUrl: urlData.originalUrl })
  } catch (error) {
    console.error(`❌ Error in redirect for shortCode: ${params.shortCode}`, error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
