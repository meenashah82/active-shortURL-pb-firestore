import { redirect } from 'next/navigation'
import { getUrlData, recordClick } from '@/lib/analytics-clean'
import { headers } from 'next/headers'

interface ShortCodePageProps {
  params: {
    shortCode: string
  }
}

export default async function ShortCodePage({ params }: ShortCodePageProps) {
  const { shortCode } = params

  try {
    console.log(`🔍 Server-side redirect for: ${shortCode}`)

    // Get URL data
    const urlData = await getUrlData(shortCode)

    if (!urlData) {
      console.log(`❌ Short code not found: ${shortCode}`)
      redirect('/not-found')
    }

    // Get headers for click tracking
    const headersList = headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const referer = headersList.get('referer') || 'Direct'
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIp || 'Unknown'

    // Convert headers to record
    const headersRecord: Record<string, string> = {}
    headersList.forEach((value, key) => {
      headersRecord[key] = value
    })

    // Record the click
    try {
      await recordClick(shortCode, userAgent, referer, ip, headersRecord)
      console.log(`📊 Click recorded for: ${shortCode}`)
    } catch (clickError) {
      console.error(`❌ Failed to record click for ${shortCode}:`, clickError)
      // Continue with redirect even if click recording fails
    }

    console.log(`🚀 Redirecting ${shortCode} to: ${urlData.originalUrl}`)
    redirect(urlData.originalUrl)

  } catch (error) {
    console.error(`❌ Error in server-side redirect for ${shortCode}:`, error)
    redirect('/not-found')
  }
}
