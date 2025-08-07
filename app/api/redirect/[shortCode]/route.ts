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

    // Enhanced header extraction with comprehensive fallbacks and logging
    const headers = request.headers
    console.log('📋 Available headers for debugging:', {
      'user-agent': headers.get('user-agent'),
      'User-Agent': headers.get('User-Agent'),
      'x-forwarded-for': headers.get('x-forwarded-for'),
      'x-real-ip': headers.get('x-real-ip'),
      'cf-connecting-ip': headers.get('cf-connecting-ip'),
      'x-client-ip': headers.get('x-client-ip'),
      'remote-addr': headers.get('remote-addr'),
      'forwarded': headers.get('forwarded'),
      'request-ip': request.ip
    })

    // User Agent extraction with multiple fallbacks
    const userAgent = 
      headers.get('user-agent') || 
      headers.get('User-Agent') || 
      headers.get('USER-AGENT') ||
      headers.get('sec-ch-ua') ||
      'Unknown Browser'

    // Enhanced IP extraction with comprehensive proxy support
    const forwardedFor = headers.get('x-forwarded-for')
    const realIP = headers.get('x-real-ip')
    const cfConnectingIP = headers.get('cf-connecting-ip')
    const clientIP = headers.get('x-client-ip')
    const forwarded = headers.get('x-forwarded')
    const forwardedForHeader = headers.get('forwarded-for')
    const forwardedHeader = headers.get('forwarded')
    const remoteAddr = headers.get('remote-addr')

    // Parse forwarded-for header (can contain multiple IPs)
    let extractedIP = 'Unknown IP'

    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first (original client)
      extractedIP = forwardedFor.split(',')[0].trim()
    } else if (cfConnectingIP) {
      // Cloudflare connecting IP
      extractedIP = cfConnectingIP.trim()
    } else if (realIP) {
      // X-Real-IP header
      extractedIP = realIP.trim()
    } else if (clientIP) {
      // X-Client-IP header
      extractedIP = clientIP.trim()
    } else if (forwarded) {
      // X-Forwarded header
      extractedIP = forwarded.split(',')[0].trim()
    } else if (forwardedForHeader) {
      // Forwarded-For header
      extractedIP = forwardedForHeader.split(',')[0].trim()
    } else if (forwardedHeader) {
      // Parse RFC 7239 Forwarded header
      const forMatch = forwardedHeader.match(/for=([^;,\s]+)/)
      if (forMatch) {
        extractedIP = forMatch[1].replace(/"/g, '').trim()
      }
    } else if (remoteAddr) {
      // Remote address
      extractedIP = remoteAddr.trim()
    } else if (request.ip) {
      // Next.js request IP
      extractedIP = request.ip
    }

    // Clean up IP address (remove port if present)
    if (extractedIP && extractedIP !== 'Unknown IP') {
      // Remove IPv6 brackets and port numbers
      extractedIP = extractedIP.replace(/^\[|\]$/g, '').split(':')[0]
    }

    const referer = 
      headers.get('referer') || 
      headers.get('Referer') || 
      headers.get('REFERER') ||
      'Direct'

    const country = 
      headers.get('cf-ipcountry') || 
      headers.get('cloudfront-viewer-country') || 
      headers.get('x-country-code') ||
      'Unknown'
      
    const acceptLanguage = 
      headers.get('accept-language') || 
      headers.get('Accept-Language') ||
      'Unknown'

    // Log extraction results for debugging
    console.log(`🖱️ Header extraction results for ${shortCode}:`, {
      userAgent: userAgent.substring(0, 100) + (userAgent.length > 100 ? '...' : ''),
      extractedIP,
      referer,
      country,
      acceptLanguage: acceptLanguage.substring(0, 50),
      extractionMethod: forwardedFor ? 'x-forwarded-for' :
                      cfConnectingIP ? 'cf-connecting-ip' :
                      realIP ? 'x-real-ip' :
                      clientIP ? 'x-client-ip' :
                      forwardedHeader ? 'forwarded' :
                      remoteAddr ? 'remote-addr' :
                      request.ip ? 'request.ip' : 'none'
    })

    // Validate critical fields and log warnings
    if (userAgent === 'Unknown Browser') {
      console.warn(`⚠️ User Agent not found for ${shortCode}. Available UA headers:`, {
        'user-agent': headers.get('user-agent'),
        'User-Agent': headers.get('User-Agent'),
        'sec-ch-ua': headers.get('sec-ch-ua')
      })
    }

    if (extractedIP === 'Unknown IP') {
      console.warn(`⚠️ IP Address not found for ${shortCode}. This may indicate:`, {
        message: 'Request may be coming through a proxy that strips IP headers',
        availableHeaders: {
          'x-forwarded-for': forwardedFor,
          'x-real-ip': realIP,
          'cf-connecting-ip': cfConnectingIP,
          'x-client-ip': clientIP,
          'forwarded': forwardedHeader,
          'remote-addr': remoteAddr,
          'request.ip': request.ip
        },
        suggestion: 'Check proxy configuration or add custom IP header handling'
      })
    }

    const clickEvent = {
      timestamp: serverTimestamp(),
      shortCode: shortCode,
      userAgent: userAgent,
      referer: referer,
      ip: extractedIP,
      country: country,
      acceptLanguage: acceptLanguage,
      "User-Agent": userAgent, // Duplicate for compatibility
      "X-Forwarded-For": forwardedFor || extractedIP,
      "client-ip": extractedIP,
    }

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
