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

function isValidCustomShortCode(shortCode: string): boolean {
  // Allow alphanumeric characters, hyphens, and underscores
  // Length between 3 and 20 characters
  const regex = /^[a-zA-Z0-9_-]{3,20}$/
  return regex.test(shortCode)
}

export async function POST(request: NextRequest) {
  try {
    const { url, customShortCode } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    let shortCode: string

    if (customShortCode) {
      // Validate custom short code format
      if (!isValidCustomShortCode(customShortCode)) {
        return NextResponse.json({ 
          error: "Custom short code must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores" 
        }, { status: 400 })
      }

      // Check if custom short code already exists
      const existingUrl = await getUrlData(customShortCode)
      if (existingUrl) {
        return NextResponse.json({ 
          error: "This custom short code is already taken. Please choose a different one." 
        }, { status: 409 })
      }

      shortCode = customShortCode
      console.log(`🔗 Creating custom short URL: ${shortCode} -> ${url}`)
    } else {
      // Generate random short code
      shortCode = generateShortCode()
      console.log(`🔗 Creating short URL: ${shortCode} -> ${url}`)
    }

    // Create the short URL using the clean analytics system
    await createShortUrl(shortCode, url)

    const shortUrl = `${request.nextUrl.origin}/${shortCode}`

    return NextResponse.json({
      shortUrl,
      shortCode,
      originalUrl: url,
      isCustom: !!customShortCode,
    })
  } catch (error) {
    console.error("❌ Error creating short URL:", error)
    return NextResponse.json({ error: "Failed to create short URL" }, { status: 500 })
  }
}
