import { NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { createShortUrl } from "@/lib/analytics-unified"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"

function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function shortenHandler(request: AuthenticatedRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log(`🔗 Creating short URL for user ${request.user?.customerId}/${request.user?.userId}`)

    // Validate URL format
    let validUrl: string
    try {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        validUrl = "https://" + url
      } else {
        validUrl = url
      }
      new URL(validUrl) // This will throw if invalid
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Generate unique short code
    let shortCode: string
    let attempts = 0
    const maxAttempts = 10

    do {
      shortCode = generateShortCode()
      attempts++

      if (attempts > maxAttempts) {
        return NextResponse.json({ error: "Failed to generate unique short code" }, { status: 500 })
      }

      // Check if short code already exists
      const existingDoc = await getDoc(doc(db, "urls", shortCode))
      if (!existingDoc.exists()) {
        break
      }
    } while (true)

    // Create the short URL with embedded analytics
    await createShortUrl(shortCode, validUrl, {
      createdBy: {
        customerId: request.user?.customerId,
        userId: request.user?.userId,
      },
    })

    const shortUrl = `${request.nextUrl.origin}/${shortCode}`

    console.log(`✅ Short URL created: ${shortCode} -> ${validUrl}`)

    return NextResponse.json({
      shortUrl,
      shortCode,
      originalUrl: validUrl,
    })
  } catch (error) {
    console.error("❌ Error creating short URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(shortenHandler)
