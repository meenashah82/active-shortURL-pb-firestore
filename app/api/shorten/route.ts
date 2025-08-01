import { type NextRequest, NextResponse } from "next/server"
import { createShortUrl } from "@/lib/analytics-clean"

function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

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

    const shortCode = generateShortCode()
    console.log(`🔗 Creating short URL: ${shortCode} -> ${url}`)

    // Create the short URL using the clean analytics system
    await createShortUrl(shortCode, url)

    const shortUrl = `${request.nextUrl.origin}/${shortCode}`

    return NextResponse.json({
      shortUrl,
      shortCode,
      originalUrl: url,
    })
  } catch (error) {
    console.error("❌ Error creating short URL:", error)
    return NextResponse.json({ error: "Failed to create short URL" }, { status: 500 })
  }
}
