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

    // Log request details for debugging
    console.log('🔍 Request debugging info:', {
      url: request.url,
      method: request.method,
      nextUrl: request.nextUrl?.href,
      geo: request.geo,
      ip: request.ip
    })

    // Log all available headers for debugging
    const allHeaders = {}
    const headerEntries = Array.from(request.headers.entries())
    headerEntries.forEach(([key, value]) => {
      allHeaders[key] = value
    })
    console.log('📋 All request headers:', allHeaders)
    console.log('📋 Headers count:', headerEntries.length)

    // Extract User Agent with multiple fallback methods
    let userAgent = 'Unknown Browser'
    
    // Try different case variations and methods
    const userAgentSources = [
      request.headers.get('user-agent'),
      request.headers.get('User-Agent'),
      request.headers.get('USER-AGENT'),
      request.headers.get('sec-ch-ua'),
      // Try accessing headers object directly if available
      (request as any).headers?.['user-agent'],
      (request as any).headers?.['User-Agent']
    ]

    for (const ua of userAgentSources) {
      if (ua && typeof ua === 'string' && ua.trim() !== '') {
        userAgent = ua.trim()
        console.log('✅ User Agent found:', userAgent.substring(0, 100))
        break
      }
    }

    // Extract IP Address with comprehensive methods
    let extractedIP = 'Unknown IP'
    
    // Try Vercel-specific geo data first
    if (request.geo?.latitude && request.geo?.longitude) {
      console.log('🌍 Geo data available:', request.geo)
    }

    // Try multiple IP extraction methods
    const ipSources = [
      // Standard proxy headers
      request.headers.get('x-forwarded-for'),
      request.headers.get('cf-connecting-ip'),
      request.headers.get('x-real-ip'),
      request.headers.get('x-client-ip'),
      request.headers.get('x-forwarded'),
      request.headers.get('forwarded-for'),
      request.headers.get('forwarded'),
      request.headers.get('remote-addr'),
      // Vercel-specific
      request.headers.get('x-vercel-forwarded-for'),
      // Next.js request IP
      request.ip,
      // Try accessing request object properties
      (request as any).socket?.remoteAddress,
      (request as any).connection?.remoteAddress
    ]

    console.log('🔍 IP source values:', {
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
      'x-real-ip': request.headers.get('x-real-ip'),
      'x-client-ip': request.headers.get('x-client-ip'),
      'x-vercel-forwarded-for': request.headers.get('x-vercel-forwarded-for'),
      'forwarded': request.headers.get('forwarded'),
      'remote-addr': request.headers.get('remote-addr'),
      'request.ip': request.ip
    })

    for (const ipSource of ipSources) {
      if (ipSource && typeof ipSource === 'string' && ipSource.trim() !== '') {
        let ip = ipSource.trim()
        
        // Handle comma-separated IPs (take first one)
        if (ip.includes(',')) {
          ip = ip.split(',')[0].trim()
        }
        
        // Handle forwarded header format
        if (ip.includes('for=')) {
          const forMatch = ip.match(/for=([^;,\s]+)/)
          if (forMatch && forMatch[1]) {
            ip = forMatch[1].replace(/["\[\]]/g, '').trim()
          }
        }
        
        // Clean up IP format
        ip = ip.replace(/^\[|\]$/g, '') // Remove IPv6 brackets
        ip = ip.replace(/['"]/g, '')    // Remove quotes
        ip = ip.split(':')[0]           // Remove port if present
        
        // Validate IP format (basic check)
        if (ip && ip !== '' && ip !== 'undefined' && ip !== 'null' && 
            (ip.includes('.') || ip.includes(':'))) { // IPv4 or IPv6
          extractedIP = ip
          console.log('✅ IP extracted:', extractedIP)
          break
        }
      }
    }

    // Extract Referer
    let referer = 'Direct'
    const refererSources = [
      request.headers.get('referer'),
      request.headers.get('Referer'),
      request.headers.get('REFERER')
    ]

    for (const ref of refererSources) {
      if (ref && typeof ref === 'string' && ref.trim() !== '') {
        referer = ref.trim()
        console.log('✅ Referer found:', referer)
        break
      }
    }

    // Extract Country with multiple sources
    let country = 'Unknown'
    const countrySources = [
      request.headers.get('cf-ipcountry'),
      request.headers.get('cloudfront-viewer-country'),
      request.headers.get('x-country-code'),
      request.headers.get('x-vercel-ip-country'),
      // Try Vercel geo data
      request.geo?.country
    ]

    for (const countrySource of countrySources) {
      if (countrySource && typeof countrySource === 'string' && countrySource.trim() !== '') {
        country = countrySource.trim()
        console.log('✅ Country found:', country)
        break
      }
    }

    // Extract Accept-Language
    let acceptLanguage = 'Unknown'
    const langSources = [
      request.headers.get('accept-language'),
      request.headers.get('Accept-Language')
    ]

    for (const lang of langSources) {
      if (lang && typeof lang === 'string' && lang.trim() !== '') {
        acceptLanguage = lang.trim()
        console.log('✅ Accept-Language found:', acceptLanguage.substring(0, 50))
        break
      }
    }

    // Final extracted data
    const extractedData = {
      userAgent,
      ip: extractedIP,
      referer,
      country,
      acceptLanguage
    }

    console.log(`🖱️ Final extracted data for ${shortCode}:`, extractedData)

    // Validate that we have at least some data
    const hasValidData = userAgent !== 'Unknown Browser' || 
                        extractedIP !== 'Unknown IP' || 
                        referer !== 'Direct' || 
                        country !== 'Unknown'

    if (!hasValidData) {
      console.warn('⚠️ No valid header data extracted - this may indicate a proxy/CDN configuration issue')
    }

    // Create click event
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
      // Add debug info
      debugInfo: {
        hasHeaders: headerEntries.length > 0,
        headerCount: headerEntries.length,
        requestMethod: request.method,
        hasGeo: !!request.geo,
        timestamp: new Date().toISOString()
      }
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
