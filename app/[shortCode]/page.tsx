import { redirect } from 'next/navigation'
import { getUrlData, trackClick } from '@/lib/analytics'

interface PageProps {
  params: {
    shortCode: string
  }
}

export default async function ShortCodePage({ params }: PageProps) {
  const { shortCode } = params
  
  try {
    console.log(`🔍 Page request for: ${shortCode}`)
    
    // Get URL data
    const urlData = await getUrlData(shortCode)
    
    if (!urlData || !urlData.isActive) {
      console.log(`❌ URL not found or inactive: ${shortCode}`)
      redirect('/not-found')
    }

    // Track the click (server-side)
    try {
      await trackClick(shortCode, {
        userAgent: 'Server-side redirect',
      })
    } catch (error) {
      console.error(`❌ Error tracking click for ${shortCode}:`, error)
    }

    console.log(`✅ Redirecting ${shortCode} to ${urlData.originalUrl}`)
    
    // Redirect to the original URL
    redirect(urlData.originalUrl)
  } catch (error) {
    console.error(`❌ Error in page for ${shortCode}:`, error)
    redirect('/not-found')
  }
}
