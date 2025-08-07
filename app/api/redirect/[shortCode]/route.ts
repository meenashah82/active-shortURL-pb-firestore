import { NextRequest, NextResponse } from 'next/server'
import { getUrlData, recordClick } from '@/lib/analytics-clean'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params
    console.log(`🔗 Redirect request for: ${shortCode}`)

    // Get URL data
    const urlData = await getUrlData(shortCode)
    
    if (!urlData) {
      console.log(`❌ URL not found: ${shortCode}`)
      return NextResponse.redirect(new URL('/not-found', request.url))
    }

    // Extract request information with better fallbacks
    const userAgent = request.headers.get('user-agent') || 
                     request.headers.get('User-Agent') || 
                     'Unknown Browser'
    
    const referer = request.headers.get('referer') || 
                   request.headers.get('Referer') || 
                   'Direct'
    
    // Try multiple IP header sources
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              request.headers.get('cf-connecting-ip') || 
              request.headers.get('x-client-ip') || 
              request.headers.get('x-forwarded') || 
              request.headers.get('forwarded-for') || 
              request.headers.get('forwarded') ||
              request.ip ||
              'Unknown IP'

    // Get the first IP if there are multiple (x-forwarded-for can be a comma-separated list)
    const clientIP = ip.split(',')[0].trim()

    // Convert headers to record for additional data
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Add additional useful headers
    const country = request.headers.get('cf-ipcountry') || 
                   request.headers.get('cloudfront-viewer-country') || 
                   'Unknown'
    
    const acceptLanguage = request.headers.get('accept-language') || 'Unknown'

    console.log(`🖱️ Recording click for ${shortCode}:`, {
      ip: clientIP,
      userAgent: userAgent.substring(0, 100), // Log first 100 chars
      referer,
      country
    })

    // Record the click with enhanced data
    try {
      await recordClick(shortCode, userAgent, referer, clientIP, {
        ...headers,
        'client-ip': clientIP,
        'country': country,
        'accept-language': acceptLanguage
      })
      console.log(`✅ Click recorded successfully for: ${shortCode}`)
    } catch (clickError) {
      console.error(`❌ Error recording click for ${shortCode}:`, clickError)
      // Continue with redirect even if click recording fails
    }

    // Ensure URL has protocol
    let targetUrl = urlData.originalUrl.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    console.log(`🔄 Redirecting ${shortCode} to: ${targetUrl}`)
    return NextResponse.redirect(targetUrl, { status: 302 })

  } catch (error) {
    console.error('❌ Error in redirect handler:', error)
    return NextResponse.redirect(new URL('/not-found', request.url))
  }
}
