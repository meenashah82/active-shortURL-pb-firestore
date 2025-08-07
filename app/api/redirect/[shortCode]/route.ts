import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, collection, addDoc, updateDoc, increment, serverTimestamp, runTransaction } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params
    console.log(`🔗 Redirect request for: ${shortCode}`)

    if (!db) {
      console.error('❌ Database not available')
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    const urlRef = doc(db, 'urls', shortCode)
    const urlDoc = await getDoc(urlRef)
    
    if (!urlDoc.exists()) {
      console.log(`❌ URL not found: ${shortCode}`)
      return NextResponse.redirect(new URL('/not-found', request.url))
    }

    const urlData = urlDoc.data()
    
    if (!urlData.isActive) {
      console.log(`❌ URL inactive: ${shortCode}`)
      return NextResponse.redirect(new URL('/not-found', request.url))
    }

    // Log all available headers for debugging
    console.log('📋 All request headers:', Object.fromEntries(request.headers.entries()))

    // Extract User Agent with fallbacks
    let userAgent = request.headers.get('user-agent') || 
                   request.headers.get('User-Agent') || 
                   request.headers.get('sec-ch-ua') || 
                   'Unknown Browser'

    // Extract IP Address with comprehensive fallbacks
    let extractedIP = 'Unknown IP'
    
    // Check all possible IP headers
    const possibleIPHeaders = [
      'x-forwarded-for',
      'cf-connecting-ip', 
      'x-real-ip',
      'x-client-ip',
      'x-forwarded',
      'forwarded-for',
      'forwarded',
      'remote-addr'
    ]

    for (const headerName of possibleIPHeaders) {
      const headerValue = request.headers.get(headerName)
      if (headerValue && headerValue.trim() !== '') {
        // Handle comma-separated IPs (take first one)
        let ip = headerValue.split(',')[0].trim()
        
        // Clean up IP format
        ip = ip.replace(/^\[|\]$/g, '') // Remove IPv6 brackets
        ip = ip.replace(/['"]/g, '')    // Remove quotes
        ip = ip.split(':')[0]           // Remove port if present
        
        if (ip && ip !== '' && ip !== 'undefined' && ip !== 'null') {
          extractedIP = ip
          console.log(`✅ IP extracted from ${headerName}: ${extractedIP}`)
          break
        }
      }
    }

    // Fallback to request.ip if available
    if (extractedIP === 'Unknown IP' && request.ip) {
      extractedIP = request.ip
      console.log(`✅ IP extracted from request.ip: ${extractedIP}`)
    }

    // Extract Referer
    let referer = request.headers.get('referer') || 
                 request.headers.get('Referer') || 
                 'Direct'

    // Extract Country
    let country = request.headers.get('cf-ipcountry') || 
                 request.headers.get('cloudfront-viewer-country') || 
                 request.headers.get('x-country-code') ||
                 'Unknown'

    // Extract Accept-Language
    let acceptLanguage = request.headers.get('accept-language') || 
                        request.headers.get('Accept-Language') ||
                        'Unknown'

    console.log(`🖱️ Extracted data for ${shortCode}:`, {
      userAgent: userAgent.substring(0, 100),
      ip: extractedIP,
      referer: referer,
      country: country,
      acceptLanguage: acceptLanguage.substring(0, 50)
    })

    // Create click event with extracted data
    const clickEvent = {
      timestamp: serverTimestamp(),
      shortCode: shortCode,
      userAgent: userAgent,
      referer: referer,
      ip: extractedIP,
      country: country,
      acceptLanguage: acceptLanguage,
      "User-Agent": userAgent,
      "X-Forwarded-For": request.headers.get('x-forwarded-for') || extractedIP,
      "client-ip": extractedIP,
    }

    console.log(`💾 Saving click event to Firestore:`, clickEvent)

    try {
      await runTransaction(db, async (transaction) => {
        const clicksRef = collection(db, 'urls', shortCode, 'clicks')
        const clickDocRef = doc(clicksRef)
        transaction.set(clickDocRef, clickEvent)

        transaction.update(urlRef, {
          totalClicks: increment(1),
          lastClickAt: serverTimestamp(),
        })
      })

      console.log(`✅ Click recorded successfully for: ${shortCode}`, {
        userAgent: userAgent !== 'Unknown Browser' ? '✓ Captured' : '❌ Missing',
        ip: extractedIP !== 'Unknown IP' ? '✓ Captured' : '❌ Missing',
        referer: referer !== 'Direct' ? '✓ Captured' : 'Direct/Missing',
        country: country !== 'Unknown' ? '✓ Captured' : '❌ Missing'
      })
    } catch (clickError) {
      console.error(`❌ Error recording click for ${shortCode}:`, clickError)
    }

    // Prepare target URL for redirect
    let targetUrl = urlData.originalUrl.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    console.log(`🔄 Redirecting ${shortCode} to: ${targetUrl}`)
    return NextResponse.redirect(targetUrl, { status: 302 })

  } catch (error) {
    console.error('❌ Error in redirect handler:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
