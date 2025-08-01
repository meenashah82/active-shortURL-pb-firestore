import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import { createShortUrl } from "@/lib/analytics-unified"

async function handler(request: NextRequest) {
  try {
    const { originalUrl } = await request.json()

    if (!originalUrl) {
      return NextResponse.json({ error: "Original URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(originalUrl)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const user = (request as any).user
    const shortUrl = await createShortUrl(originalUrl, user.userId)

    return NextResponse.json({
      success: true,
      shortUrl: shortUrl.shortCode,
      originalUrl: shortUrl.originalUrl,
      fullShortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/${shortUrl.shortCode}`,
    })
  } catch (error) {
    console.error("Error creating short URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(handler)
