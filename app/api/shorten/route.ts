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

function validateCustomShortCode(code: string): string | null {
  if (code.length < 3) {
    return "Custom code must be at least 3 characters long"
  }
  
  if (code.length > 20) {
    return "Custom code must be no more than 20 characters long"
  }
  
  if (!/^[a-zA-Z0-9-_]+$/.test(code)) {
    return "Custom code can only contain letters, numbers, hyphens, and underscores"
  }
  
  // Reserved words
  const reserved = ['api', 'admin', 'dashboard', 'analytics', 'www', 'app', 'mail', 'ftp', 'localhost', 'test', 'dev']
  if (reserved.includes(code.toLowerCase())) {
    return "This custom code is reserved and cannot be used"
  }
  
  return null
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
      const validationError = validateCustomShortCode(customShortCode)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }

      // Check if custom short code is already taken
      const existingUrl = await getUrlData(customShortCode)
      if (existingUrl) {
        return NextResponse.json({ 
          error: "This custom code is already taken. Please choose a different one." 
        }, { status: 409 })
      }

      shortCode = customShortCode
      console.log(`🔗 Creating short URL with custom code: ${shortCode} -> ${url}`)
    } else {
      // Generate random short code and ensure it's unique
      let attempts = 0
      const maxAttempts = 10

      do {
        shortCode = generateShortCode()
        const existingUrl = await getUrlData(shortCode)
        if (!existingUrl) break
        
        attempts++
        if (attempts >= maxAttempts) {
          return NextResponse.json({ 
            error: "Unable to generate unique short code. Please try again." 
          }, { status: 500 })
        }
      } while (attempts < maxAttempts)

      console.log(`🔗 Creating short URL with generated code: ${shortCode} -> ${url}`)
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
