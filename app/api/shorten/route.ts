import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"

function generateShortCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
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

    console.log("🔗 Creating short URL for:", url)

    // Validate URL
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Generate unique short code
    let shortCode: string
    let attempts = 0
    do {
      shortCode = generateShortCode()
      attempts++
      if (attempts > 10) {
        return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 })
      }
      const existing = await getDoc(doc(db, "urls", shortCode))
      if (!existing.exists()) break
    } while (true)

    // Create URL document with embedded analytics
    const urlData = {
      originalUrl: url.startsWith("http") ? url : `https://${url}`,
      shortCode,
      createdAt: new Date(),
      isActive: true,
      customerId: request.user.customerId,
      userId: request.user.userId,
      // Embedded analytics fields
      totalClicks: 0,
      lastClickAt: null,
      clickEvents: [],
    }

    await setDoc(doc(db, "urls", shortCode), urlData)

    const shortUrl = `${request.nextUrl.origin}/${shortCode}`

    console.log("✅ Short URL created:", shortCode)

    return NextResponse.json({
      shortCode,
      shortUrl,
      originalUrl: urlData.originalUrl,
    })
  } catch (error) {
    console.error("❌ Error creating short URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(shortenHandler)
