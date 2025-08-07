import { NextRequest, NextResponse } from 'next/server'
import { getFirebase } from '@/lib/firebase'
import { doc, getDoc, collection, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params
  const { db } = getFirebase()

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 })
  }

  try {
    // Get URL data
    const urlDoc = await getDoc(doc(db, 'urls', shortCode))
    
    if (!urlDoc.exists()) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    const urlData = urlDoc.data()
    
    // Record click in subcollection
    const headers = Object.fromEntries(request.headers.entries())
    
    await addDoc(collection(db, 'urls', shortCode, 'clicks'), {
      timestamp: serverTimestamp(),
      userAgent: headers['user-agent'] || '',
      referer: headers.referer || '',
      ip: headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown',
      country: headers['cf-ipcountry'] || 'unknown',
    })

    // Update URL document
    await updateDoc(doc(db, 'urls', shortCode), {
      totalClicks: increment(1),
      lastClickAt: serverTimestamp(),
    })

    // Ensure URL has protocol
    let targetUrl = urlData.originalUrl.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    return NextResponse.redirect(targetUrl, 302)
  } catch (error) {
    console.error('Error in redirect API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
