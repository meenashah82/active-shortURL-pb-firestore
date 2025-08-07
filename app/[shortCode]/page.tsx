import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment, addDoc, collection, Timestamp } from 'firebase/firestore'

interface ShortCodePageProps {
  params: {
    shortCode: string
  }
}

async function getUrlDataDirect(shortCode: string) {
  try {
    const urlRef = doc(db, "urls", shortCode)
    const urlDoc = await getDoc(urlRef)
    
    if (!urlDoc.exists()) {
      return null
    }

    return urlDoc.data()
  } catch (error) {
    console.error(`Error getting URL data for ${shortCode}:`, error)
    return null
  }
}

async function recordClickDirect(shortCode: string, userAgent: string, referer: string, ip: string) {
  try {
    // Add to clicks collection
    await addDoc(collection(db, 'clicks'), {
      shortCode,
      timestamp: Timestamp.now(),
      userAgent,
      referer,
      ip
    })

    // Update URL document
    const urlRef = doc(db, "urls", shortCode)
    await updateDoc(urlRef, {
      totalClicks: increment(1),
      lastClickAt: Timestamp.now()
    })

    console.log(`Click recorded for: ${shortCode}`)
  } catch (error) {
    console.error(`Failed to record click for ${shortCode}:`, error)
  }
}

export default async function ShortCodePage({ params }: ShortCodePageProps) {
  const { shortCode } = params

  console.log(`Processing redirect for: ${shortCode}`)

  // Get URL data directly
  const urlData = await getUrlDataDirect(shortCode)

  if (!urlData) {
    console.log(`Short code not found: ${shortCode}`)
    redirect('/not-found')
  }

  // Get headers for click tracking
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || 'Unknown'
  const referer = headersList.get('referer') || 'Direct'
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'Unknown'

  // Record the click (fire and forget)
  recordClickDirect(shortCode, userAgent, referer, ip).catch(console.error)

  // Ensure URL has protocol
  let targetUrl = urlData.originalUrl.trim()
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl
  }

  console.log(`Redirecting ${shortCode} to: ${targetUrl}`)
  
  // Use permanent redirect to avoid caching issues
  redirect(targetUrl)
}
