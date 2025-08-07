import { NextRequest, NextResponse } from 'next/server'
import { getFirebase } from '@/lib/firebase'
import { collection, doc, setDoc, getDoc } from 'firebase/firestore'

function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const { db } = getFirebase()
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Generate unique short code
    let shortCode: string
    let attempts = 0
    const maxAttempts = 10

    do {
      shortCode = generateShortCode()
      attempts++
      
      if (attempts > maxAttempts) {
        return NextResponse.json({ error: 'Failed to generate unique short code' }, { status: 500 })
      }

      const existingDoc = await getDoc(doc(db, 'urls', shortCode))
      if (!existingDoc.exists()) {
        break
      }
    } while (true)

    // Create URL document
    const urlData = {
      originalUrl: url,
      shortCode,
      createdAt: new Date().toISOString(),
      totalClicks: 0,
      isActive: true
    }

    await setDoc(doc(db, 'urls', shortCode), urlData)

    return NextResponse.json({
      shortCode,
      shortUrl: `${request.nextUrl.origin}/${shortCode}`,
      originalUrl: url
    })

  } catch (error) {
    console.error('Error creating short URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
