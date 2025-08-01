import { type NextRequest, NextResponse } from "next/server"
import { getUrlData, recordClick } from "@/lib/analytics-clean"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params
    console.log(`hi, this is nick`)
    console.log(`🔍 REDIRECT API: Processing redirect request for shortCode: ${shortCode}`)

    // Get URL data using the clean analytics system
    const urlData = await getUrlData(shortCode)

    if (!urlData) {
      console.log(`❌ REDIRECT API: URL not found for shortCode: ${shortCode}`)
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    console.log(`✅ REDIRECT API: Found URL: ${urlData.originalUrl} for shortCode: ${shortCode}`)

    // Extract all headers for detailed click tracking
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    console.log(`extracted header values ...`)

    // Record the click with detailed header information
    const userAgent = request.headers.get("user-agent") || ""
    const referer = request.headers.get("referer") || ""
    const ip = request.ip || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || ""

    console.log(`🔄 REDIRECT API: About to record click for shortCode: ${shortCode}`)
    console.log(`📊 REDIRECT API: Available headers: ${Object.keys(headers).join(", ")}`)
    console.log(`👤 REDIRECT API: User-Agent: ${userAgent}`)
    console.log(`🔗 REDIRECT API: Referer: ${referer}`)
    console.log(`🌐 REDIRECT API: IP: ${ip}`)

    // Record click - this MUST happen before returning the redirect URL
    try {
      console.log(`🔄 REDIRECT API: BEFORE calling recordClick() for shortCode: ${shortCode}`)
      await recordClick(shortCode, userAgent, referer, ip, headers)
      console.log(
        `✅ REDIRECT API: AFTER calling recordClick() - Click recorded successfully for shortCode: ${shortCode}`,
      )
    } catch (clickError) {
      console.error(`❌ REDIRECT API: CRITICAL - Click recording failed for shortCode: ${shortCode}`)
      console.error(`❌ REDIRECT API: Error name: ${clickError instanceof Error ? clickError.name : "Unknown"}`)
      console.error(
        `❌ REDIRECT API: Error message: ${clickError instanceof Error ? clickError.message : String(clickError)}`,
      )
      console.error(`❌ REDIRECT API: Error stack:`, clickError instanceof Error ? clickError.stack : undefined)
      // Still continue with redirect but log the failure
    }

    console.log(`✅ REDIRECT API: Returning redirect URL for shortCode: ${shortCode}`)
    // Return redirect URL for client-side redirect
    return NextResponse.json({
      redirectUrl: urlData.originalUrl,
      success: true,
      shortCode: shortCode,
    })
  } catch (error) {
    console.error(`❌ REDIRECT API: Error in redirect API for shortCode: ${params.shortCode}`)
    console.error(`❌ REDIRECT API: Error name: ${error instanceof Error ? error.name : "Unknown"}`)
    console.error(`❌ REDIRECT API: Error message: ${error instanceof Error ? error.message : String(error)}`)
    console.error(`❌ REDIRECT API: Error stack:`, error instanceof Error ? error.stack : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
