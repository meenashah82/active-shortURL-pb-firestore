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
  shortCode: string
  timestamp: Timestamp
  userAgent?: string
  referer?: string
  ip?: string
  "User-Agent"?: string
  "X-Forwarded-For"?: string
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
  shortCode: string
  originalUrl: string
  totalClicks: number
  createdAt: Timestamp
  lastClickAt?: Timestamp
}

// Create short URL with placeholder click document
export async function createShortUrl(shortCode: string, originalUrl: string): Promise<void> {
  const urlRef = doc(db, "urls", shortCode)

  console.log(`📝 Creating short URL: ${shortCode} -> ${originalUrl}`)

  try {
    // Check if short code already exists
    const urlDoc = await getDoc(urlRef)
    if (urlDoc.exists()) {
      throw new Error(`Short code ${shortCode} already exists`)
    }

    // Create the URL document
    const urlData: UrlData = {
      shortCode,
      originalUrl,
      createdAt: Timestamp.now(),
      totalClicks: 0,
      isActive: true,
    }

    await setDoc(urlRef, urlData)
    console.log(`✅ Short URL created successfully: ${shortCode}`)
  } catch (error) {
    console.error(`❌ Error creating short URL:`, error)
    throw error
  }
}

// Get URL data
export async function getUrlData(shortCode: string): Promise<UrlData | null> {
  const urlRef = doc(db, "urls", shortCode)

  try {
    console.log(`📖 Getting URL data for: ${shortCode}`)
    const urlDoc = await getDoc(urlRef)

    if (!urlDoc.exists()) {
      console.log(`❌ URL data not found for: ${shortCode}`)
      return null
    }

    const data = urlDoc.data() as UrlData
    console.log(`📖 URL data retrieved: ${shortCode}`, data)
    return data
  } catch (error) {
    console.error(`❌ Error getting URL data for ${shortCode}:`, error)
    return null
  }
}

// Record click in clicks subcollection and increment totalClicks
export async function recordClick(
  shortCode: string,
  userAgent: string,
  referer: string,
  ip: string,
  headers: Record<string, string>
): Promise<void> {
  try {
    console.log(`🖱️ Recording click for: ${shortCode}`)

    // Check if URL exists
    const urlRef = doc(db, "urls", shortCode)
    const urlSnap = await getDoc(urlRef)

    if (!urlSnap.exists()) {
      console.log(`⚠️ URL document doesn't exist for: ${shortCode}`)
      return
    }

    // Create click document with all headers
    const clickEvent: ClickEvent = {
      timestamp: serverTimestamp(),
      shortCode: shortCode,
      userAgent: headers["user-agent"] || userAgent,
      referer: headers["referer"] || referer,
      ip: headers["x-forwarded-for"] || ip,
      "User-Agent": headers["user-agent"] || userAgent,
      "X-Forwarded-For": headers["x-forwarded-for"] || ip,
    }

    // Add click to subcollection
    const clicksRef = collection(db, "urls", shortCode, "clicks")
    await addDoc(clicksRef, clickEvent)

    // Update URL document with incremented click count
    await updateDoc(urlRef, {
      totalClicks: increment(1),
      lastClickAt: serverTimestamp(),
    })

    console.log(`✅ Click recorded successfully for: ${shortCode}`)
  } catch (error) {
    console.error("❌ Error recording click:", error)
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
      clickHistory.push(clickData)
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
      shortCode,
      originalUrl: urlData.originalUrl,
      totalClicks: urlData.totalClicks || 0,
      createdAt: urlData.createdAt,
      lastClickAt: urlData.lastClickAt,
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
        createdAt: data.createdAt,
        lastClickAt: data.lastClickAt,
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
export function subscribeToAnalytics(shortCode: string, callback: (data: UrlData | null) => void): () => void {
  const urlRef = doc(db, "urls", shortCode)

  console.log(`🔄 Starting real-time analytics subscription for: ${shortCode}`)

  return onSnapshot(
    urlRef,
    {
      includeMetadataChanges: true,
    },
    async (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UrlData
        console.log("📡 Analytics update received:", {
          shortCode,
          totalClicks: data.totalClicks,
        })
        callback(data)
      } else {
        console.log(`❌ No analytics document found for: ${shortCode}`)
        callback(null)
      }
    },
    (error) => {
      console.error("❌ Real-time analytics subscription error:", error)
      callback(null)
    },
  )
}

// Get recent clicks across all URLs (for dashboard)
export function subscribeToRecentClicks(
  callback: (clicks: Array<ClickEvent & { shortCode: string }>) => void,
  limitCount = 50,
): () => void {
  const urlsQuery = query(
    collection(db, 'urls'),
    where('totalClicks', '>', 0),
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  )

  return onSnapshot(
    urlsQuery,
    {
      includeMetadataChanges: true,
    },
    async (snapshot) => {
      const recentClicks: Array<ClickEvent & { shortCode: string }> = []

      for (const doc of snapshot.docs) {
        const urlData = doc.data() as UrlData
        const clicksQuery = query(
          collection(db, 'urls', urlData.shortCode, 'clicks'),
          orderBy('timestamp', 'desc'),
          limit(5)
        )
        const clicksSnapshot = await getDocs(clicksQuery)
        clicksSnapshot.forEach((clickDoc) => {
          const clickData = clickDoc.data() as ClickEvent
          recentClicks.push({ ...clickData, shortCode: urlData.shortCode })
        })
      }

      recentClicks.sort((a, b) => {
        const aTime = a.timestamp?.seconds || 0
        const bTime = b.timestamp?.seconds || 0
        return bTime - aTime
      })

      callback(recentClicks.slice(0, limitCount))
    },
    (error) => {
      console.error("Error in recent clicks subscription:", error)
      callback([])
    },
  )
}

// Subscribe to top URLs
export function subscribeToTopUrls(
  callback: (urls: Array<{ shortCode: string; clicks: number; originalUrl: string }>) => void,
  limitCount = 10,
): () => void {
  const urlsQuery = query(
    collection(db, 'urls'),
    where('isActive', '==', true),
    orderBy('totalClicks', 'desc'),
    limit(limitCount),
  )

  return onSnapshot(
    urlsQuery,
    {
      includeMetadataChanges: true,
    },
    async (snapshot) => {
      const urls: Array<{ shortCode: string; clicks: number; originalUrl: string }> = []

      for (const doc of snapshot.docs) {
        const urlData = doc.data() as UrlData
        urls.push({
          shortCode: urlData.shortCode,
          clicks: urlData.totalClicks,
          originalUrl: urlData.originalUrl,
        })
      }

      callback(urls.slice(0, limitCount))
    },
    (error) => {
      console.error("Error in top URLs subscription:", error)
      callback([])
    },
  )
}
