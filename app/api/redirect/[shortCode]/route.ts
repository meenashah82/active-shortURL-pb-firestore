import { type NextRequest, NextResponse } from "next/server"
import { getUrlData, trackClick } from "@/lib/analytics-unified"

export async function GET(request: NextRequest, { params }: { params: { shortCode: string } }) {
  try {
    const { shortCode } = params

    if (!shortCode) {
      return NextResponse.json({ error: "Short code is required" }, { status: 400 })
    }

    // Get URL data from unified collection
    const urlData = await getUrlData(shortCode)

    if (!urlData || !urlData.isActive) {
      return NextResponse.redirect(new URL("/not-found", request.url))
    }

    // Track the click with embedded analytics
    const userAgent = request.headers.get("user-agent") || undefined
    const referer = request.headers.get("referer") || undefined
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.ip || undefined

    await trackClick(shortCode, {
      userAgent,
      referer,
      ip,
    })

    // Redirect to the original URL
    return NextResponse.redirect(urlData.originalUrl, { status: 302 })
  } catch (error) {
    console.error("Error in redirect:", error)
    return NextResponse.redirect(new URL("/not-found", request.url))
  }
}
