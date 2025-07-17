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

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

function validateCustomShortcode(shortcode: string): string | null {
  if (shortcode.length < 3 || shortcode.length > 20) {
    return "Custom shortcode must be between 3-20 characters"
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(shortcode)) {
    return "Custom shortcode can only contain letters, numbers, hyphens, and underscores"
  }

  // Check for reserved words
  const reservedWords = ["api", "admin", "www", "app", "dashboard", "analytics", "test", "debug"]
  if (reservedWords.includes(shortcode.toLowerCase())) {
    return "This shortcode is reserved and cannot be used"
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const { url, customShortcode } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    if (!isValidUrl(url)) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    let shortCode: string

    if (customShortcode) {
      // Validate custom shortcode
      const validationError = validateCustomShortcode(customShortcode)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }

      // Check if custom shortcode is already taken
      const existingUrl = await getUrlData(customShortcode)
      if (existingUrl) {
        return NextResponse.json(
          {
            error: "This shortcode is already taken. Please choose a different one.",
          },
          { status: 409 },
        )
      }

      shortCode = customShortcode
    } else {
      // Generate random shortcode
      let attempts = 0
      const maxAttempts = 10

      do {
        shortCode = generateShortCode()
        const existingUrl = await getUrlData(shortCode)
        if (!existingUrl) break
        attempts++
      } while (attempts < maxAttempts)

      if (attempts >= maxAttempts) {
        return NextResponse.json(
          {
            error: "Unable to generate unique shortcode. Please try again.",
          },
          { status: 500 },
        )
      }
    }

    // Create the short URL with additional metadata
    await createShortUrl(shortCode, url, {
      isCustom: !!customShortcode,
      createdVia: "web_form",
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${request.headers.get("host")}`
    const shortUrl = `${baseUrl}/${shortCode}`

    return NextResponse.json({
      shortUrl,
      shortCode,
      originalUrl: url,
      isCustom: !!customShortcode,
    })
  } catch (error) {
    console.error("Error in shorten API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
