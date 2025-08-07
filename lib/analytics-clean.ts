import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  increment,
  getDocs,
} from "firebase/firestore"
import { db } from "./firebase"

export interface ClickEvent {
  id?: string
  shortCode?: string
  timestamp: Timestamp
  userAgent?: string
  referer?: string
  ip?: string
  country?: string
  acceptLanguage?: string
  "User-Agent"?: string
  "X-Forwarded-For"?: string
  "client-ip"?: string
  _placeholder?: boolean
}

export interface UrlData {
  shortCode: string
  originalUrl: string
  createdAt: Timestamp
  totalClicks: number
  isActive: boolean
  expiresAt?: Timestamp
  lastClickAt?: Timestamp
}

export interface AnalyticsData {
  totalClicks: number
  recentClicks: ClickEvent[]
  urlData: UrlData
}

// Create short URL with placeholder click document
export async function createShortUrl(shortCode: string, originalUrl: string): Promise<void> {
  try {
    console.log(`🔗 Creating short URL: ${shortCode} -> ${originalUrl}`)

    // Check if URL already exists first
    const urlRef = doc(db, "urls", shortCode)
    const urlSnap = await getDoc(urlRef)
    
    if (urlSnap.exists()) {
      console.log(`⚠️ URL already exists: ${shortCode}`)
      throw new Error(`Short code ${shortCode} already exists`)
    }

    // Create expiration date (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const urlData: UrlData = {
      shortCode,
      originalUrl,
      createdAt: serverTimestamp(),
      isActive: true,
      expiresAt: Timestamp.fromDate(expiresAt),
      totalClicks: 0,
    }

    // Create URL document
    await setDoc(urlRef, urlData)

    // Create placeholder document in clicks subcollection to initialize it
    const clicksRef = collection(db, "urls", shortCode, "clicks")
    const placeholderClick = {
      _placeholder: true,
      createdAt: serverTimestamp(),
      shortCode: shortCode,
      note: "This is a placeholder document to initialize the clicks subcollection"
    }

    await addDoc(clicksRef, placeholderClick)
    
    console.log(`✅ Short URL created successfully: ${shortCode}`)
  } catch (error) {
    console.error("❌ Error creating short URL:", error)
    throw error
  }
}

// Get URL data
export async function getUrlData(shortCode: string): Promise<UrlData | null> {
  try {
    const urlRef = doc(db, 'urls', shortCode)
    const urlDoc = await getDoc(urlRef)
    
    if (!urlDoc.exists()) {
      return null
    }
    
    return urlDoc.data() as UrlData
  } catch (error) {
    console.error('Error getting URL data:', error)
    return null
  }
}

// Record click in clicks subcollection and increment totalClicks
export async function recordClick(
  shortCode: string, 
  userAgent: string, 
  referer: string, 
  ip: string, 
  additionalHeaders: Record<string, string> = {}
): Promise<void> {
  try {
    const clickEvent = {
      timestamp: serverTimestamp(),
      shortCode,
      userAgent,
      referer,
      ip,
      "User-Agent": userAgent,
      "X-Forwarded-For": ip,
      ...additionalHeaders
    }

    // Add click to subcollection
    const clicksRef = collection(db, 'urls', shortCode, 'clicks')
    await addDoc(clicksRef, clickEvent)

    // Update URL document
    const urlRef = doc(db, 'urls', shortCode)
    await updateDoc(urlRef, {
      totalClicks: increment(1),
      lastClickAt: serverTimestamp()
    })

    console.log(`✅ Click recorded for ${shortCode}`)
  } catch (error) {
    console.error('Error recording click:', error)
    throw error
  }
}

// Get complete URL info with analytics
export async function getUrlWithAnalytics(shortCode: string): Promise<{
  url: UrlData | null
  clicks: number
  clickHistory: ClickEvent[]
}> {
  try {
    const urlData = await getUrlData(shortCode)
    
    if (!urlData) {
      return { url: null, clicks: 0, clickHistory: [] }
    }

    // Get click history from clicks subcollection
    const clicksRef = collection(db, "urls", shortCode, "clicks")
    const clicksQuery = query(
      clicksRef,
      orderBy("timestamp", "desc"),
      limit(50)
    )
    
    const clicksSnapshot = await getDocs(clicksQuery)
    const clickHistory: ClickEvent[] = []

    clicksSnapshot.forEach((doc) => {
      const clickData = doc.data() as ClickEvent
      // Skip placeholder documents
      if (!clickData._placeholder) {
        clickHistory.push({
          ...clickData,
          id: doc.id
        })
      }
    })

    return {
      url: urlData,
      clicks: urlData.totalClicks,
      clickHistory: clickHistory,
    }
  } catch (error) {
    console.error("Error getting URL with analytics:", error)
    return { url: null, clicks: 0, clickHistory: [] }
  }
}

// Legacy function for backward compatibility
export async function getAnalyticsData(shortCode: string) {
  const result = await getUrlWithAnalytics(shortCode)
  return result.url ? {
    url: result.url,
    clicks: result.clickHistory,
    totalClicks: result.clicks,
  } : null
}

// Get recent URLs
export async function getRecentUrls(limitCount: number = 10): Promise<UrlData[]> {
  const urlsQuery = query(
    collection(db, "urls"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  )

  try {
    const snapshot = await getDocs(urlsQuery)
    const urls: UrlData[] = []

    snapshot.forEach((doc) => {
      urls.push(doc.data() as UrlData)
    })

    return urls
  } catch (error) {
    console.error("❌ Error getting recent URLs:", error)
    return []
  }
}

// Get analytics for a specific URL
export async function getAnalytics(shortCode: string): Promise<AnalyticsData | null> {
  try {
    console.log(`📊 Getting analytics for ${shortCode}`)

    const urlRef = doc(db, 'urls', shortCode)
    const urlDoc = await getDoc(urlRef)

    if (!urlDoc.exists()) {
      console.log(`❌ URL ${shortCode} not found`)
      return null
    }

    const urlData = urlDoc.data() as UrlData

    const analytics: AnalyticsData = {
      totalClicks: urlData.totalClicks || 0,
      recentClicks: [],
      urlData: urlData,
    }

    console.log(`📊 Retrieved analytics for ${shortCode}:`, analytics)
    return analytics
  } catch (error) {
    console.error('❌ Error getting analytics:', error)
    return null
  }
}

// Get all URLs
export async function getAllUrls(): Promise<AnalyticsData[]> {
  try {
    console.log('📊 Getting all URLs')

    const urlsQuery = query(
      collection(db, 'urls'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    const urlsSnapshot = await getDocs(urlsQuery)
    const urls: AnalyticsData[] = []

    for (const doc of urlsSnapshot.docs) {
      const data = doc.data() as UrlData
      urls.push({
        shortCode: doc.id,
        originalUrl: data.originalUrl,
        totalClicks: data.totalClicks || 0,
        recentClicks: [],
        urlData: data,
      })
    }

    console.log(`📊 Retrieved ${urls.length} URLs`)
    return urls
  } catch (error) {
    console.error('❌ Error getting all URLs:', error)
    return []
  }
}

// Enhanced real-time listener for analytics data
export function subscribeToAnalytics(
  shortCode: string, 
  callback: (data: UrlData | null) => void
): () => void {
  const urlRef = doc(db, 'urls', shortCode)
  
  const unsubscribe = onSnapshot(
    urlRef,
    {
      includeMetadataChanges: false
    },
    (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UrlData
        callback(data)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error('Error in analytics subscription:', error)
      callback(null)
    }
  )

  return unsubscribe
}

// Subscribe to click history
export function subscribeToClickHistory(
  shortCode: string,
  callback: (clicks: ClickEvent[]) => void,
  limitCount: number = 50
): () => void {
  const clicksRef = collection(db, 'urls', shortCode, 'clicks')
  const clicksQuery = query(
    clicksRef,
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  )

  const unsubscribe = onSnapshot(
    clicksQuery,
    {
      includeMetadataChanges: false
    },
    (snapshot) => {
      const clicks: ClickEvent[] = []
      
      snapshot.forEach((doc) => {
        const clickData = doc.data() as ClickEvent
        if (!clickData._placeholder) {
          clicks.push({
            ...clickData,
            id: doc.id
          })
        }
      })
      
      callback(clicks)
    },
    (error) => {
      console.error('Error in click history subscription:', error)
      callback([])
    }
  )

  return unsubscribe
}
