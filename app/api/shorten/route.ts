import { type NextRequest, NextResponse } from "next/server"
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

function generateShortCode(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function isValidShortCode(shortCode: string): boolean {
  // Allow letters, numbers, hyphens, and underscores
  const validPattern = /^[a-zA-Z0-9-_]+$/
  return validPattern.test(shortCode) && shortCode.length >= 3 && shortCode.length <= 20
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== SHORTEN URL REQUEST ===")

    const { url, customShortCode } = await request.json()
    console.log("1. URL to shorten:", url)
    console.log("2. Custom shortcode:", customShortCode)

    if (!url || typeof url !== "string") {
      console.log("ERROR: URL is required")
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    if (!isValidUrl(url)) {
      console.log("ERROR: Invalid URL format")
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    let shortCode: string

    // Handle custom shortcode
    if (customShortCode && customShortCode.trim()) {
      const trimmedCustomCode = customShortCode.trim()

      if (!isValidShortCode(trimmedCustomCode)) {
        console.log("ERROR: Invalid custom shortcode format")
        return NextResponse.json(
          {
            error:
              "Custom shortcode must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores",
          },
          { status: 400 },
        )
      }

      // Check if custom shortcode is available
      const customRef = doc(db, "urls", trimmedCustomCode)
      const existingCustomDoc = await getDoc(customRef)

      if (existingCustomDoc.exists()) {
        console.log("ERROR: Custom shortcode already exists")
        return NextResponse.json({ error: "Custom shortcode is already taken" }, { status: 409 })
      }

      shortCode = trimmedCustomCode
      console.log("3. Using custom shortcode:", shortCode)
    } else {
      // Generate a unique short code
      console.log("3. Generating random short code...")
      shortCode = generateShortCode()
      let attempts = 0
      const maxAttempts = 10

      // Check for uniqueness
      while (attempts < maxAttempts) {
        const urlRef = doc(db, "urls", shortCode)
        const existingDoc = await getDoc(urlRef)

        if (!existingDoc.exists()) {
          break // Found unique code
        }

        shortCode = generateShortCode()
        attempts++
        console.log(`4. Code ${shortCode} exists, trying again (attempt ${attempts})`)
      }

      if (attempts >= maxAttempts) {
        console.log("ERROR: Could not generate unique short code")
        return NextResponse.json({ error: "Could not generate unique short code" }, { status: 500 })
      }
    }

    console.log("5. Final short code:", shortCode)

    // Create expiration date (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Create URL document
    const urlRef = doc(db, "urls", shortCode)
    const analyticsRef = doc(db, "analytics", shortCode)

    const urlData = {
      originalUrl: url,
      shortCode,
      createdAt: serverTimestamp(),
      isActive: true,
      expiresAt: Timestamp.fromDate(expiresAt),
      isCustom: !!customShortCode?.trim(), // Track if it was a custom shortcode
    }

    const analyticsData = {
      shortCode,
      totalClicks: 0,
      createdAt: serverTimestamp(),
      clickEvents: [],
    }

    console.log("6. Creating documents in Firestore...")

    // Create both documents
    await Promise.all([setDoc(urlRef, urlData), setDoc(analyticsRef, analyticsData)])

    console.log("7. Documents created successfully")

    const baseUrl = request.nextUrl.origin
    const shortUrl = `${baseUrl}/${shortCode}`

    console.log("8. Short URL created:", shortUrl)
    console.log("=== SHORTEN URL COMPLETE ===")

    return NextResponse.json({
      shortUrl,
      originalUrl: url,
      shortCode,
      createdAt: new Date().toISOString(),
      isCustom: !!customShortCode?.trim(),
    })
  } catch (error) {
    console.error("=== SHORTEN URL ERROR ===", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
