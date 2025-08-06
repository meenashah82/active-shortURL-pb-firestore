import { NextRequest, NextResponse } from 'next/server'
import { getUrlData, createShortUrl } from '@/lib/analytics-clean'

function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function isValidCustomShortCode(code: string): boolean {
  // Must be 3-20 characters, alphanumeric, hyphens, and underscores only
  const regex = /^[a-zA-Z0-9_-]{3,20}$/
  return regex.test(code)
}

export async function POST(request: NextRequest) {
  try {
    const { url, customShortCode } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let shortCode: string
    let isCustom = false

    // If custom short code is provided, validate and check availability
    if (customShortCode && customShortCode.trim()) {
      const trimmedCode = customShortCode.trim()
      
      if (!isValidCustomShortCode(trimmedCode)) {
        return NextResponse.json({ 
          error: 'Custom short code must be 3-20 characters and contain only letters, numbers, hyphens, and underscores' 
        }, { status: 400 })
      }

      // Check if custom short code already exists
      const existingUrl = await getUrlData(trimmedCode)
      if (existingUrl) {
        return NextResponse.json({ 
          error: 'This custom short code is already taken. Please choose a different one.' 
        }, { status: 409 })
      }

      shortCode = trimmedCode
      isCustom = true
    } else {
      // Generate a unique short code
      let attempts = 0
      do {
        shortCode = generateShortCode()
        attempts++
        if (attempts > 10) {
          return NextResponse.json({ error: 'Failed to generate unique short code' }, { status: 500 })
        }
      } while (await getUrlData(shortCode))
    }

    // Create the short URL
    await createShortUrl(shortCode, url)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const shortUrl = `${baseUrl}/${shortCode}`

    return NextResponse.json({
      shortCode,
      shortUrl,
      originalUrl: url,
      isCustom
    })
  } catch (error) {
    console.error('Error creating short URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
