import { type NextRequest, NextResponse } from "next/server"
import { createShortUrl, getUrlData } from "@/lib/analytics"

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
    console.log("🚀 API: Starting URL shortening request")
    
    const { url } = await request.json()
    console.log("📋 API: Received URL:", url)

    if (!url) {
      console.log("❌ API: No URL provided")
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
      console.log("✅ API: URL format is valid")
    } catch {
      console.log("❌ API: Invalid URL format")
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Generate unique short code
    let shortCode: string
    let attempts = 0
    const maxAttempts = 10

    do {
      shortCode = generateShortCode()
      attempts++
      console.log(`🎲 API: Generated short code attempt ${attempts}: ${shortCode}`)
      
      if (attempts > maxAttempts) {
        console.log("❌ API: Max attempts reached")
        return NextResponse.json({ error: "Failed to generate unique short code" }, { status: 500 })
      }
      
      // Check if this short code already exists
      const existingUrl = await getUrlData(shortCode)
      if (!existingUrl) {
        console.log("✅ API: Short code is unique")
        break
      } else {
        console.log("⚠️ API: Short code exists, trying again")
      }
    } while (true)

    console.log(`🔗 API: Creating short URL: ${shortCode} -> ${url}`)

    // Create the short URL
    await createShortUrl(shortCode, url)
    console.log("✅ API: Short URL created successfully")

    const shortUrl = `${request.nextUrl.origin}/${shortCode}`

    const response = {
      shortUrl,
      shortCode,
      originalUrl: url,
    }

    console.log("📤 API: Sending response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ API: Error creating short URL:", error)
    return NextResponse.json({ 
      error: "Failed to create short URL",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
