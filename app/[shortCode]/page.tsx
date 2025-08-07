import { notFound, redirect } from 'next/navigation'
import { getFirebase } from '@/lib/firebase'
import { doc, getDoc, collection, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'

interface UrlData {
  originalUrl: string
  shortCode: string
  createdAt: string
  totalClicks: number
  lastClickAt?: string
}

async function getUrlData(shortCode: string): Promise<UrlData | null> {
  const { db } = getFirebase()
  if (!db) return null

  try {
    const urlDoc = await getDoc(doc(db, 'urls', shortCode))
    if (!urlDoc.exists()) {
      return null
    }

    return urlDoc.data() as UrlData
  } catch (error) {
    console.error('Error fetching URL data:', error)
    return null
  }
}

async function recordClick(shortCode: string, headers: any) {
  const { db } = getFirebase()
  if (!db) return

  try {
    // Create a new click document in the subcollection
    await addDoc(collection(db, 'urls', shortCode, 'clicks'), {
      timestamp: serverTimestamp(),
      userAgent: headers['user-agent'] || '',
      referer: headers.referer || '',
      ip: headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown',
      country: headers['cf-ipcountry'] || 'unknown',
    })

    // Update the URL document with incremented click count
    await updateDoc(doc(db, 'urls', shortCode), {
      totalClicks: increment(1),
      lastClickAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error recording click:', error)
  }
}

export default async function RedirectPage({
  params,
}: {
  params: Promise<{ shortCode: string }>
}) {
  const { shortCode } = await params
  
  const urlData = await getUrlData(shortCode)
  
  if (!urlData) {
    notFound()
  }

  // Record the click (fire and forget)
  recordClick(shortCode, {}).catch(console.error)

  // Ensure URL has protocol
  let targetUrl = urlData.originalUrl.trim()
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl
  }

  redirect(targetUrl)
}
