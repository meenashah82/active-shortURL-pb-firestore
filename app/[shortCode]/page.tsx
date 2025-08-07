import { redirect, notFound } from 'next/navigation'
import { getUrlData, recordClick } from '@/lib/analytics-clean'
import { headers } from 'next/headers'

interface PageProps {
  params: {
    shortCode: string
  }
}

export default async function ShortCodePage({ params }: PageProps) {
  const { shortCode } = params
  
  try {
    console.log(`🔗 Page redirect request for: ${shortCode}`)
    
    // Get URL data
    const urlData = await getUrlData(shortCode)
    
    if (!urlData) {
      console.log(`❌ URL not found: ${shortCode}`)
      notFound()
    }

    // Get headers for click tracking
    const headersList = headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const referer = headersList.get('referer') || 'Direct'
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               'Unknown'

    // Record the click
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
    redirect(urlData.originalUrl)

  } catch (error) {
    console.error(`❌ Error in page redirect for ${shortCode}:`, error)
    notFound()
  }
}
