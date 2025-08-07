import { type NextRequest, NextResponse } from "next/server"
import { createShortUrl, getUrlData } from "@/lib/analytics-clean"

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
    console.log("🚀 POST /api/shorten - Starting request")
    
    const body = await request.json()
    console.log("📋 Request body:", body)
    
    const { url } = body

    if (!url) {
      console.log("❌ No URL provided")
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
      console.log("✅ URL format is valid:", url)
    } catch {
      console.log("❌ Invalid URL format:", url)
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Generate unique short code
    let shortCode: string
    let attempts = 0
    const maxAttempts = 10

    do {
      shortCode = generateShortCode()
      attempts++
      console.log(`🎲 Generated short code attempt ${attempts}: ${shortCode}`)
      
      if (attempts > maxAttempts) {
        console.log("❌ Max attempts reached for generating unique short code")
        return NextResponse.json({ error: "Failed to generate unique short code" }, { status: 500 })
      }
      
      // Check if this short code already exists
      const existingUrl = await getUrlData(shortCode)
      if (!existingUrl) {
        console.log("✅ Short code is unique:", shortCode)
        break
      } else {
        console.log("⚠️ Short code already exists, trying again:", shortCode)
      }
    } while (true)

    console.log(`🔗 Creating short URL: ${shortCode} -> ${url}`)

    // Create the short URL using the clean analytics system
    await createShortUrl(shortCode, url)
    console.log("✅ Short URL created successfully")

    const shortUrl = `${request.nextUrl.origin}/${shortCode}`
    console.log("🎉 Final short URL:", shortUrl)

    const response = {
      shortUrl,
      shortCode,
      originalUrl: url,
    }

    console.log("📤 Sending response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Error creating short URL:", error)
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ 
      error: "Failed to create short URL", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
