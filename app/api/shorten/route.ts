import { type NextRequest, NextResponse } from "next/server"
import { createShortUrl } from "@/lib/analytics-clean"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    console.log(`🔗 Creating short URL for: ${url}`)

    // Create short URL using clean analytics system
    const shortCode = await createShortUrl(url, "anonymous")

    const shortUrl = `${request.nextUrl.origin}/${shortCode}`

    console.log(`✅ Created short URL: ${shortUrl}`)

    return NextResponse.json({
      shortUrl,
      shortCode,
      originalUrl: url,
    })
  } catch (error) {
    console.error("❌ Shorten error:", error)
    return NextResponse.json({ error: "Failed to create short URL" }, { status: 500 })
  }
}
