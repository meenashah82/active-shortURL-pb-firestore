import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

// Generate a random short code
function generateShortCode(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Validate custom short code
function validateCustomShortCode(code: string): string | null {
  if (!code) return null
  
  if (code.length < 3 || code.length > 20) {
    return "Custom code must be 3-20 characters long"
  }
  
  if (!/^[a-zA-Z0-9-_]+$/.test(code)) {
    return "Custom code can only contain letters, numbers, hyphens, and underscores"
  }
  
  const reserved = ['api', 'admin', 'dashboard', 'analytics', 'www', 'app', 'mail', 'ftp', 'localhost', 'test', 'dev', 'auth', 'login', 'register', 'about', 'contact', 'help', 'terms', 'privacy']
  if (reserved.includes(code.toLowerCase())) {
    return "This custom code is reserved and cannot be used"
  }
  
  return null
}

// Check if short code exists
async function shortCodeExists(shortCode: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'urls', shortCode)
    const docSnap = await getDoc(docRef)
    return docSnap.exists()
  } catch (error) {
    console.error('Error checking short code existence:', error)
    return true // Assume it exists to be safe
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, customShortCode } = body

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return NextResponse.json(
          { error: 'URL must use HTTP or HTTPS protocol' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    let shortCode: string

    // Handle custom short code
    if (customShortCode) {
      const validationError = validateCustomShortCode(customShortCode)
      if (validationError) {
        return NextResponse.json(
          { error: validationError },
          { status: 400 }
        )
      }

      // Check if custom code already exists
      if (await shortCodeExists(customShortCode)) {
        return NextResponse.json(
          { error: 'This custom code is already taken. Please choose a different one.' },
          { status: 409 }
        )
      }

      shortCode = customShortCode
    } else {
      // Generate random short code
      let attempts = 0
      const maxAttempts = 10

      do {
        shortCode = generateShortCode()
        attempts++
        
        if (attempts >= maxAttempts) {
          // Try with longer code
          shortCode = generateShortCode(8)
          break
        }
      } while (await shortCodeExists(shortCode))

      // Final check for longer code
      if (await shortCodeExists(shortCode)) {
        return NextResponse.json(
          { error: 'Unable to generate unique short code. Please try again.' },
          { status: 500 }
        )
      }
    }

    // Create URL document
    const urlData = {
      originalUrl: url,
      shortCode,
      createdAt: serverTimestamp(),
      totalClicks: 0,
      isCustom: !!customShortCode,
      lastClickedAt: null,
    }

    // Save to Firestore
    const docRef = doc(db, 'urls', shortCode)
    await setDoc(docRef, urlData)

    // Get the base URL for the response
    const baseUrl = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const shortUrl = `${protocol}://${baseUrl}/${shortCode}`

    console.log(`Created short URL: ${shortCode} -> ${url}`)

    return NextResponse.json({
      shortCode,
      shortUrl,
      originalUrl: url,
      isCustom: !!customShortCode,
    })

  } catch (error) {
    console.error('Error creating short URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
