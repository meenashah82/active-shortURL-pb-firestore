import { NextResponse } from "next/server"
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
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
    console.log("🔗 Shorten API called by user:", request.user)

    const body = await request.json()
    const { url } = body

    if (!url) {
      console.error("❌ No URL provided")
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log("🔗 Creating short URL for:", url)

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
      console.error("❌ Invalid URL format:", url)
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
        console.error("❌ Failed to generate unique short code after", maxAttempts, "attempts")
        return NextResponse.json({ error: "Failed to generate unique short code" }, { status: 500 })
      }

      // Check if short code already exists
      const existingDoc = await getDoc(doc(db, "urls", shortCode))
      if (!existingDoc.exists()) {
        break
      }
    } while (true)

    // Create the URL document with embedded analytics
    const urlData = {
      shortCode,
      originalUrl: validUrl,
      createdAt: Timestamp.now(),
      isActive: true,
      totalClicks: 0,
      lastClickAt: null,
      clickEvents: [],
      customerId: request.user?.customerId,
      userId: request.user?.userId,
    }

    await setDoc(doc(db, "urls", shortCode), urlData)

    const shortUrl = `${request.nextUrl.origin}/${shortCode}`

    console.log("✅ Short URL created:", shortCode, "->", validUrl)

    return NextResponse.json({
      shortUrl,
      shortCode,
      originalUrl: validUrl,
    })
  } catch (error) {
    console.error("❌ Error in shorten API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(shortenHandler)
