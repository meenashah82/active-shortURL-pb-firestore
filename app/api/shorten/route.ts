import { NextResponse } from "next/server"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
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

async function isShortCodeUnique(shortCode: string): Promise<boolean> {
  const q = query(collection(db, "urls"), where("shortCode", "==", shortCode))
  const querySnapshot = await getDocs(q)
  return querySnapshot.empty
}

async function handler(request: AuthenticatedRequest) {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

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

    // Generate unique short code
    let shortCode: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    do {
      shortCode = generateShortCode()
      isUnique = await isShortCodeUnique(shortCode)
      attempts++
    } while (!isUnique && attempts < maxAttempts)

    if (!isUnique) {
      return NextResponse.json({ error: "Unable to generate unique short code" }, { status: 500 })
    }

    // Save to Firestore with user context
    const docRef = await addDoc(collection(db, "urls"), {
      originalUrl: url,
      shortCode,
      customerId: request.user.customerId,
      userId: request.user.userId,
      createdAt: new Date().toISOString(),
      totalClicks: 0,
    })

    const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/${shortCode}`

    return NextResponse.json({
      success: true,
      shortUrl,
      shortCode,
      originalUrl: url,
      id: docRef.id,
    })
  } catch (error) {
    console.error("Error creating short URL:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuth(handler)
