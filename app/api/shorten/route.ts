import { NextResponse } from "next/server"
import { withAuth, type AuthenticatedRequest } from "@/lib/auth-middleware"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

async function handler(request: AuthenticatedRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Generate short code
    const shortCode = Math.random().toString(36).substring(2, 8)

    // Create URL document with embedded analytics
    const urlData = {
      originalUrl: url,
      shortCode,
      createdAt: serverTimestamp(),
      isActive: true,
      customerId: request.user.customerId,
      userId: request.user.userId,
      // Embedded analytics fields
      totalClicks: 0,
      lastClickAt: null,
      clickEvents: [],
    }

    await addDoc(collection(db, "urls"), urlData)

    const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/${shortCode}`

    return NextResponse.json({
      shortUrl,
      shortCode,
      originalUrl: url,
    })
  } catch (error) {
    console.error("Error creating short URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(handler)
