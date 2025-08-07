import { NextRequest, NextResponse } from "next/server"
import { getUrlData, recordClick } from "@/lib/analytics-clean"

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const { shortCode } = params
    console.log(`🔗 Redirect request for: ${shortCode}`)

    // Get URL data
    const urlData = await getUrlData(shortCode)
    
    if (!urlData) {
      console.log(`❌ URL not found: ${shortCode}`)
      return NextResponse.redirect(new URL('/not-found', request.url))
    }

    // Record the click
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const referer = request.headers.get('referer') || 'Direct'
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'Unknown'

    try {
      await recordClick(shortCode, {
        userAgent,
        referer,
        ip,
        clickSource: 'direct'
      })
      console.log(`✅ Click recorded for: ${shortCode}`)
    } catch (clickError) {
      console.error(`⚠️ Failed to record click for ${shortCode}:`, clickError)
      // Continue with redirect even if click recording fails
    }

    console.log(`🚀 Redirecting ${shortCode} to: ${urlData.originalUrl}`)
    return NextResponse.redirect(urlData.originalUrl)

  } catch (error) {
    console.error(`❌ Error in redirect for ${params.shortCode}:`, error)
    return NextResponse.redirect(new URL('/not-found', request.url))
  }
}
