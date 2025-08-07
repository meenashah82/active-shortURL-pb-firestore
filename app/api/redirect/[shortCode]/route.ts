import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, collection, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
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

    // Get URL data
    const urlRef = doc(db, 'urls', shortCode)
    const urlDoc = await getDoc(urlRef)
    
    if (!urlDoc.exists()) {
      console.log(`❌ URL not found: ${shortCode}`)
      return NextResponse.redirect(new URL('/not-found', request.url))
    }

    const urlData = urlDoc.data()
    
    // Check if URL is active
    if (!urlData.isActive) {
      console.log(`❌ URL inactive: ${shortCode}`)
      return NextResponse.redirect(new URL('/not-found', request.url))
    }

    // Extract request information
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const referer = request.headers.get('referer') || ''
    const forwardedFor = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'Unknown'

    console.log(`🖱️ Recording click for ${shortCode} from ${forwardedFor}`)

    // Record click in subcollection
    const clickEvent = {
      timestamp: serverTimestamp(),
      shortCode: shortCode,
      userAgent: userAgent,
      referer: referer,
      ip: forwardedFor,
      "User-Agent": userAgent,
      "X-Forwarded-For": forwardedFor,
    }

    try {
      // Add click to subcollection
      const clicksRef = collection(db, 'urls', shortCode, 'clicks')
      await addDoc(clicksRef, clickEvent)

      // Update URL document with incremented click count
      await updateDoc(urlRef, {
        totalClicks: increment(1),
        lastClickAt: serverTimestamp(),
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
