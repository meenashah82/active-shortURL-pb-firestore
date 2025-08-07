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

    // Extract User Agent
    const userAgent = 
      request.headers.get('user-agent') || 
      request.headers.get('User-Agent') || 
      'Unknown Browser'

    // Extract IP Address with comprehensive fallbacks
    let extractedIP = 'Unknown IP'
    
    // Try different IP headers in order of reliability
    const xForwardedFor = request.headers.get('x-forwarded-for')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    const xRealIP = request.headers.get('x-real-ip')
    const xClientIP = request.headers.get('x-client-ip')
    const forwarded = request.headers.get('forwarded')
    const remoteAddr = request.headers.get('remote-addr')
    
    if (xForwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      extractedIP = xForwardedFor.split(',')[0].trim()
    } else if (cfConnectingIP) {
      // Cloudflare connecting IP
      extractedIP = cfConnectingIP.trim()
    } else if (xRealIP) {
      // X-Real-IP header
      extractedIP = xRealIP.trim()
    } else if (xClientIP) {
      // X-Client-IP header
      extractedIP = xClientIP.trim()
    } else if (forwarded) {
      // Parse Forwarded header for IP
      const forMatch = forwarded.match(/for=([^;,\s]+)/)
      if (forMatch && forMatch[1]) {
        extractedIP = forMatch[1].replace(/["\[\]]/g, '').trim()
      }
    } else if (remoteAddr) {
      // Remote address header
      extractedIP = remoteAddr.trim()
    } else if (request.ip) {
      // Next.js request IP
      extractedIP = request.ip.trim()
    }

    // Clean up IP format
    if (extractedIP && extractedIP !== 'Unknown IP') {
      extractedIP = extractedIP
        .replace(/^\[|\]$/g, '') // Remove IPv6 brackets
        .replace(/['"]/g, '')    // Remove quotes
        .split(':')[0]           // Remove port if present
        .trim()
      
      // Validate IP is not empty after cleanup
      if (!extractedIP || extractedIP === '' || extractedIP === 'undefined' || extractedIP === 'null') {
        extractedIP = 'Unknown IP'
      }
    }

    const referer = request.headers.get('referer') || 'Direct'
    const country = request.headers.get('cf-ipcountry') || 'Unknown'
    const acceptLanguage = request.headers.get('accept-language') || 'Unknown'

    console.log(`🖱️ Recording click for ${shortCode}:`, {
      userAgent: userAgent.substring(0, 50) + '...',
      ip: extractedIP,
      referer,
      country
    })

    const clickEvent = {
      timestamp: serverTimestamp(),
      shortCode: shortCode,
      userAgent: userAgent,
      referer: referer,
      ip: extractedIP,
      country: country,
      acceptLanguage: acceptLanguage,
      "User-Agent": userAgent,
      "X-Forwarded-For": xForwardedFor || extractedIP,
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
