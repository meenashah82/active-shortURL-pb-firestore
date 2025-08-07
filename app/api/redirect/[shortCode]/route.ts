import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, collection, addDoc, updateDoc, increment, serverTimestamp, runTransaction } from 'firebase/firestore'
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

    const userAgent = request.headers.get('user-agent') || 
                     request.headers.get('User-Agent') || 
                     'Unknown Browser'
    
    const referer = request.headers.get('referer') || 
                   request.headers.get('Referer') || 
                   'Direct'
    
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              request.headers.get('cf-connecting-ip') || 
              request.headers.get('x-client-ip') || 
              request.headers.get('x-forwarded') || 
              request.headers.get('forwarded-for') || 
              request.headers.get('forwarded') ||
              request.ip ||
              'Unknown IP'

    const clientIP = ip.split(',')[0].trim()
    const country = request.headers.get('cf-ipcountry') || 
                   request.headers.get('cloudfront-viewer-country') || 
                   'Unknown'
    const acceptLanguage = request.headers.get('accept-language') || 'Unknown'

    console.log(`🖱️ Recording click for ${shortCode}:`, {
      ip: clientIP,
      userAgent: userAgent.substring(0, 100),
      referer,
      country
    })

    const clickEvent = {
      timestamp: serverTimestamp(),
      shortCode: shortCode,
      userAgent: userAgent || 'Unknown Browser',
      referer: referer || 'Direct',
      ip: clientIP || 'Unknown IP',
      country: country || 'Unknown',
      acceptLanguage: acceptLanguage || 'Unknown',
      "User-Agent": userAgent || 'Unknown Browser',
      "X-Forwarded-For": clientIP || 'Unknown IP',
      "client-ip": clientIP || 'Unknown IP',
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
