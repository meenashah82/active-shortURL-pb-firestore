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

function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function validateShortcode(shortcode: string): boolean {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(shortcode)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, customShortcode } = body

    // Validate URL
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    if (!validateUrl(url)) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Validate custom shortcode if provided
    if (customShortcode) {
      if (typeof customShortcode !== "string") {
        return NextResponse.json({ error: "Invalid shortcode format" }, { status: 400 })
      }

      if (!validateShortcode(customShortcode)) {
        return NextResponse.json(
          {
            error:
              "Custom shortcode must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores",
          },
          { status: 400 },
        )
      }

      // Check if custom shortcode is already taken
      const existingUrl = await getUrlData(customShortcode)
      if (existingUrl) {
        return NextResponse.json(
          { error: "This shortcode is already taken. Please choose a different one." },
          { status: 409 },
        )
      }
    }

    // Generate or use custom shortcode
    let shortCode = customShortcode
    if (!shortCode) {
      // Generate unique shortcode
      let attempts = 0
      do {
        shortCode = generateShortCode()
        attempts++
        if (attempts > 10) {
          return NextResponse.json({ error: "Unable to generate unique shortcode. Please try again." }, { status: 500 })
        }
      } while (await getUrlData(shortCode))
    }

    // Create the short URL
    await createShortUrl(shortCode, url)

    // Get the base URL for the response
    const baseUrl = request.nextUrl.origin
    const shortUrl = `${baseUrl}/${shortCode}`

    return NextResponse.json({
      shortCode,
      shortUrl,
      originalUrl: url,
      isCustom: !!customShortcode,
    })
  } catch (error) {
    console.error("Error in shorten API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
