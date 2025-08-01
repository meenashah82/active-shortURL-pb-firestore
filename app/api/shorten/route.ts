import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import { db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"

async function shortenHandler(request: NextRequest, user: any) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // Generate short code
    const shortCode = Math.random().toString(36).substring(2, 8)

    // Create URL document with embedded analytics
    const urlData = {
      originalUrl: url,
      shortCode,
      createdAt: new Date(),
      isActive: true,
      createdBy: user.customerId,
      // Embedded analytics fields
      totalClicks: 0,
      lastClickAt: null,
      clickEvents: [],
    }

    // Save to Firestore
    await setDoc(doc(db, "urls", shortCode), urlData)

    console.log("✅ Short URL created:", shortCode)

    return NextResponse.json({
      shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://wodify.link"}/${shortCode}`,
      originalUrl: url,
    })
  } catch (error) {
    console.error("Error creating short URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(shortenHandler)
