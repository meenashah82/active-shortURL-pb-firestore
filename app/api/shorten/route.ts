import { NextRequest, NextResponse } from "next/server"
import { createShortUrl, getUrlData } from "@/lib/analytics-clean"

function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function validateCustomShortCode(code: string): string | null {
  // Length check
  if (code.length < 3 || code.length > 20) {
    return "Custom code must be between 3-20 characters"
  }
  
  // Character check
  if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
    return "Custom code can only contain letters, numbers, hyphens, and underscores"
  }
  
  // Reserved words check
  const reservedWords = ['api', 'admin', 'dashboard', 'analytics', 'auth', 'login', 'register', 'app', 'www']
  if (reservedWords.includes(code.toLowerCase())) {
    return "This code is reserved and cannot be used"
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { url, customShortCode } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    if (!validateUrl(url)) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    let shortCode = ""
    let isCustom = false

    // Handle custom short code
    if (customShortCode && customShortCode.trim()) {
      const trimmedCode = customShortCode.trim()
      
      // Validate custom short code
      const validationError = validateCustomShortCode(trimmedCode)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }

      // Check if custom code already exists
      const existingUrl = await getUrlData(trimmedCode)
      if (existingUrl) {
        return NextResponse.json({ error: "This custom code is already taken" }, { status: 409 })
      }

      shortCode = trimmedCode
      isCustom = true
    } else {
      // Generate unique short code
      let attempts = 0
      const maxAttempts = 10

      do {
        shortCode = generateShortCode()
        const existingUrl = await getUrlData(shortCode)
        if (!existingUrl) break
        attempts++
      } while (attempts < maxAttempts)

      if (attempts >= maxAttempts) {
        return NextResponse.json({ error: "Unable to generate unique short code" }, { status: 500 })
      }
    }

    // Create the short URL
    await createShortUrl(shortCode, url)

    console.log(`✅ Short URL created: ${shortCode} -> ${url} (custom: ${isCustom})`)

    return NextResponse.json({
      shortCode,
      originalUrl: url,
      shortUrl: `${request.nextUrl.origin}/${shortCode}`,
      isCustom
    })
  } catch (error) {
    console.error("Error in shorten API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
