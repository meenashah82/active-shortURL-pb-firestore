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

    // Simple, direct header extraction like version 280
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const referer = request.headers.get('referer') || ''
    const xForwardedFor = request.headers.get('x-forwarded-for')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    const xRealIP = request.headers.get('x-real-ip')
    
    // Simple IP extraction - take the first available
    let ip = 'Unknown'
    if (xForwardedFor) {
      ip = xForwardedFor.split(',')[0].trim()
    } else if (cfConnectingIP) {
      ip = cfConnectingIP
    } else if (xRealIP) {
      ip = xRealIP
    } else if (request.ip) {
      ip = request.ip
    }

    const country = request.headers.get('cf-ipcountry') || 'Unknown'
    const acceptLanguage = request.headers.get('accept-language') || 'Unknown'

    console.log(`Recording click for ${shortCode}:`, {
      userAgent,
      ip,
      referer,
      country
    })

    const clickEvent = {
      timestamp: serverTimestamp(),
      shortCode,
      userAgent,
      referer,
      ip,
      country,
      acceptLanguage
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

      console.log(`✅ Click recorded for: ${shortCode}`)
    } catch (clickError) {
      console.error(`❌ Error recording click:`, clickError)
    }

    let targetUrl = urlData.originalUrl.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    return NextResponse.redirect(targetUrl, { status: 302 })

  } catch (error) {
    console.error('❌ Error in redirect handler:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
