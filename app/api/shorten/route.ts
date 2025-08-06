import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"

function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function validateCustomShortCode(code: string): string | null {
  if (!code) return null
  
  if (code.length < 3) {
    return "Custom code must be at least 3 characters long"
  }
  
  if (code.length > 20) {
    return "Custom code must be no more than 20 characters long"
  }
  
  if (!/^[a-zA-Z0-9-_]+$/.test(code)) {
    return "Custom code can only contain letters, numbers, hyphens, and underscores"
  }
  
  // Reserved words
  const reserved = ['api', 'admin', 'dashboard', 'analytics', 'www', 'app', 'mail', 'ftp', 'localhost', 'test', 'dev']
  if (reserved.includes(code.toLowerCase())) {
    return "This custom code is reserved and cannot be used"
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { url, customShortCode } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    let shortCode: string

    // Handle custom short code
    if (customShortCode) {
      const validationError = validateCustomShortCode(customShortCode)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }

      // Check if custom code already exists
      const customDocRef = doc(db, "urls", customShortCode)
      const customDocSnap = await getDoc(customDocRef)
      
      if (customDocSnap.exists()) {
        return NextResponse.json({ error: "This custom code is already taken" }, { status: 409 })
      }

      shortCode = customShortCode
    } else {
      // Generate random short code
      let attempts = 0
      const maxAttempts = 10

      do {
        shortCode = generateShortCode()
        const docRef = doc(db, "urls", shortCode)
        const docSnap = await getDoc(docRef)
        
        if (!docSnap.exists()) {
          break
        }
        
        attempts++
      } while (attempts < maxAttempts)

      if (attempts >= maxAttempts) {
        return NextResponse.json({ error: "Unable to generate unique short code" }, { status: 500 })
      }
    }

    // Create the document
    const docRef = doc(db, "urls", shortCode)
    await setDoc(docRef, {
      originalUrl: url,
      shortCode,
      createdAt: serverTimestamp(),
      totalClicks: 0,
      isCustom: !!customShortCode,
    })

    const shortUrl = `${request.nextUrl.origin}/${shortCode}`

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
