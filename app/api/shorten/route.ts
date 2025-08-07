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

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/shorten - Request received')
  
  try {
    // Parse request body
    const body = await request.json()
    console.log('📋 Request body:', body)
    
    const { url } = body

    // Validate URL
    if (!url || typeof url !== 'string') {
      console.log('❌ Invalid URL provided:', url)
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      )
    }

    if (!isValidUrl(url)) {
      console.log('❌ Invalid URL format:', url)
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    console.log('✅ URL validation passed:', url)

    // Get Firebase instance
    const { db } = getFirebase()
    if (!db) {
      console.error('❌ Firebase database not available')
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    console.log('✅ Firebase database connected')

    // Generate unique short code
    let shortCode: string
    let attempts = 0
    const maxAttempts = 10

    do {
      shortCode = generateShortCode()
      attempts++
      
      console.log(`🎲 Generated short code attempt ${attempts}: ${shortCode}`)
      
      // Check if short code already exists
      const docRef = doc(db, 'urls', shortCode)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        console.log('✅ Short code is unique:', shortCode)
        break
      }
      
      console.log('⚠️ Short code already exists, trying again...')
      
      if (attempts >= maxAttempts) {
        console.error('❌ Max attempts reached for short code generation')
        return NextResponse.json(
          { error: 'Failed to generate unique short code' },
          { status: 500 }
        )
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

    console.log('📝 Creating URL document:', urlData)

    const docRef = doc(db, 'urls', shortCode)
    await setDoc(docRef, urlData)

    console.log('✅ URL document created successfully')

    // Create response
    const response = {
      shortCode,
      originalUrl: url,
      shortUrl: `${request.nextUrl.origin}/${shortCode}`,
      createdAt: urlData.createdAt
    }

    console.log('📤 Sending response:', response)

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('❌ Error in POST /api/shorten:', error)
    console.error('❌ Error stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
