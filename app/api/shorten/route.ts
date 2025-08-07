import { NextRequest, NextResponse } from 'next/server'
import { createShortUrl, getUrlData } from '@/lib/analytics-clean'

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

    // Generate unique short code
    let shortCode: string
    let attempts = 0
    const maxAttempts = 10

    do {
      shortCode = generateShortCode()
      attempts++
      
      console.log(`🎲 Generated short code attempt ${attempts}: ${shortCode}`)
      
      // Check if short code already exists
      const existingUrl = await getUrlData(shortCode)
      
      if (!existingUrl) {
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

    // Create URL using analytics-clean library
    console.log(`🔗 Creating short URL: ${shortCode} -> ${url}`)
    
    try {
      await createShortUrl(shortCode, url)
      console.log('✅ Short URL created successfully')
    } catch (createError) {
      console.error('❌ Error creating short URL:', createError)
      return NextResponse.json(
        { 
          error: 'Failed to create short URL',
          details: createError instanceof Error ? createError.message : String(createError)
        },
        { status: 500 }
      )
    }

    // Create response
    const response = {
      shortCode,
      originalUrl: url,
      shortUrl: `${request.nextUrl.origin}/${shortCode}`,
      createdAt: new Date().toISOString()
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
