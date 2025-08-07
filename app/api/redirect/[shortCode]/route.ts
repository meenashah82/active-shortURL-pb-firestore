import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, collection, addDoc, updateDoc, increment, serverTimestamp, runTransaction } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ipAddress } from '@vercel/functions'

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

    // Use Vercel's ipAddress helper function
    const clientIP = ipAddress(request) || 'Unknown IP'
    console.log('🔍 Vercel ipAddress helper result:', clientIP)

    // Extract User Agent directly
    const userAgent = request.headers.get('user-agent') || 'Unknown Browser'
    console.log('🔍 User Agent:', userAgent)

    // Extract Referer directly
    const referer = request.headers.get('referer') || 'Direct'
    console.log('🔍 Referer:', referer)

    // Use Vercel's geo data for country
    const country = request.geo?.country || 'Unknown'
    console.log('🔍 Country from geo:', country)

    // Extract Accept-Language
    const acceptLanguage = request.headers.get('accept-language') || 'Unknown'

    console.log(`🖱️ Extracted data for ${shortCode}:`, {
      userAgent: userAgent.substring(0, 100),
      ip: clientIP,
      referer: referer,
      country: country,
      acceptLanguage: acceptLanguage.substring(0, 50)
    })

    const clickEvent = {
      timestamp: serverTimestamp(),
      shortCode: shortCode,
      userAgent: userAgent,
      referer: referer,
      ip: clientIP,
      country: country,
      acceptLanguage: acceptLanguage,
      "User-Agent": userAgent,
      "X-Forwarded-For": clientIP,
      "client-ip": clientIP,
    }

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

      console.log(`✅ Click recorded successfully for: ${shortCode}`)
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
