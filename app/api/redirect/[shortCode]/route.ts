import { type NextRequest, NextResponse } from "next/server"
import { getUrlData, trackClick } from "@/lib/analytics"

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const { shortCode } = params
    console.log(`🔍 Redirect request for: ${shortCode}`)

    // Get URL data
    const urlData = await getUrlData(shortCode)
    
    if (!urlData || !urlData.isActive) {
      console.log(`❌ URL not found or inactive: ${shortCode}`)
      return NextResponse.redirect(new URL('/not-found', request.url))
    }

    // Track the click
    const clickData = {
      userAgent: request.headers.get('user-agent') || undefined,
      referer: request.headers.get('referer') || undefined,
      ip: request.ip || request.headers.get('x-forwarded-for') || undefined,
    }

    // Track click asynchronously
    trackClick(shortCode, clickData).catch(error => {
      console.error(`❌ Error tracking click for ${shortCode}:`, error)
    })

    console.log(`✅ Redirecting ${shortCode} to ${urlData.originalUrl}`)
    
    // Redirect to original URL
    return NextResponse.redirect(urlData.originalUrl)
  } catch (error) {
    console.error(`❌ Error in redirect for ${params.shortCode}:`, error)
    return NextResponse.redirect(new URL('/not-found', request.url))
  }
}
