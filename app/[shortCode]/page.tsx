import { redirect } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'

interface PageProps {
  params: {
    shortCode: string
  }
}

async function getUrlAndRecordClick(shortCode: string) {
  try {
    const docRef = doc(db, 'urls', shortCode)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    
    // Record the click
    await updateDoc(docRef, {
      totalClicks: increment(1),
      lastClickedAt: serverTimestamp(),
    })

    console.log(`Redirecting ${shortCode} to ${data.originalUrl}`)
    
    return data.originalUrl
  } catch (error) {
    console.error('Error getting URL or recording click:', error)
    return null
  }
}

export default async function RedirectPage({ params }: PageProps) {
  const { shortCode } = params

  if (!shortCode) {
    redirect('/404')
  }

  const originalUrl = await getUrlAndRecordClick(shortCode)

  if (!originalUrl) {
    redirect('/404')
  }

  // Ensure the URL has a protocol
  let redirectUrl = originalUrl
  if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
    redirectUrl = `https://${redirectUrl}`
  }

  redirect(redirectUrl)
}
