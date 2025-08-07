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

    // Extract request information
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const referer = request.headers.get('referer') || ''
    const forwardedFor = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'Unknown'

    // Convert headers to record
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    console.log(`🖱️ Recording click for ${shortCode} from ${forwardedFor}`)

    // Record the click (this will trigger real-time updates)
    try {
      await recordClick(shortCode, userAgent, referer, forwardedFor, headers)
      console.log(`✅ Click recorded successfully for: ${shortCode}`)
    } catch (clickError) {
      console.error(`❌ Error recording click for ${shortCode}:`, clickError)
      // Continue with redirect even if click recording fails
    }

    // Redirect to original URL
    console.log(`🔄 Redirecting ${shortCode} to: ${urlData.originalUrl}`)
    return NextResponse.redirect(urlData.originalUrl, { status: 302 })

  } catch (error) {
    console.error('❌ Error in redirect handler:', error)
    return NextResponse.redirect(new URL('/not-found', request.url))
  }
}
