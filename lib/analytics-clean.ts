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
  timestamp: any
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
  createdAt: any
  totalClicks: number
  isActive: boolean
  expiresAt?: any
  lastClickAt?: any
}

export interface AnalyticsData {
  shortCode: string
  originalUrl: string
  totalClicks: number
  createdAt: any
  lastClickAt?: any
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
    console.log(`📖 Getting URL data for: ${shortCode}`)
    const urlRef = doc(db, "urls", shortCode)
    const urlSnap = await getDoc(urlRef)

    if (!urlSnap.exists()) {
      console.log(`📖 URL document not found: ${shortCode}`)
      return null
    }

    const data = urlSnap.data() as UrlData

    // Check if URL has expired
    if ((data.expiresAt && data.expiresAt.toDate() < new Date()) || !data.isActive) {
      console.log(`📖 URL expired or inactive: ${shortCode}`)
      return null
    }

    console.log(`📖 URL data retrieved: ${shortCode}`, {
      totalClicks: data.totalClicks,
      isActive: data.isActive
    })
    return data
  } catch (error) {
    console.error("❌ Error getting URL data:", error)
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

    // Check if URL exists and is active
    const urlRef = doc(db, "urls", shortCode)
    const urlSnap = await getDoc(urlRef)
    
    if (!urlSnap.exists()) {
      console.log(`⚠️ URL document doesn't exist for: ${shortCode}`)
      return
    }

    const urlData = urlSnap.data() as UrlData
    if (!urlData.isActive) {
      console.log(`⚠️ URL is inactive: ${shortCode}`)
      return
    }

    // Create comprehensive click document
    const clickEvent: ClickEvent = {
      timestamp: serverTimestamp(),
      shortCode: shortCode,
      userAgent: userAgent || 'Unknown Browser',
      referer: referer || 'Direct',
      ip: ip || 'Unknown IP',
      country: headers['country'] || headers['cf-ipcountry'] || 'Unknown',
      acceptLanguage: headers['accept-language'] || 'Unknown',
      "User-Agent": userAgent || 'Unknown Browser',
      "X-Forwarded-For": headers['x-forwarded-for'] || ip || 'Unknown IP',
      "client-ip": headers['client-ip'] || ip || 'Unknown IP',
    }

    console.log(`🖱️ Creating click event with data:`, {
      shortCode,
      userAgent: clickEvent.userAgent?.substring(0, 50) + '...',
      ip: clickEvent.ip,
      country: clickEvent.country,
      referer: clickEvent.referer
    })

    // Add click to subcollection first
    const clicksRef = collection(db, "urls", shortCode, "clicks")
    await addDoc(clicksRef, clickEvent)

    // Then update URL document with incremented click count
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
    (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UrlData
        console.log("📡 Analytics update received:", {
          shortCode,
          totalClicks: data.totalClicks,
          fromCache: doc.metadata.fromCache,
          hasPendingWrites: doc.metadata.hasPendingWrites
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
          if (!clickData._placeholder) {
            recentClicks.push({ ...clickData, shortCode: urlData.shortCode })
          }
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
    (snapshot) => {
      const urls: Array<{ shortCode: string; clicks: number; originalUrl: string }> = []

      snapshot.forEach((doc) => {
        const urlData = doc.data() as UrlData
        urls.push({
          shortCode: urlData.shortCode,
          clicks: urlData.totalClicks,
          originalUrl: urlData.originalUrl,
        })
      })

      callback(urls)
    },
    (error) => {
      console.error("Error in top URLs subscription:", error)
      callback([])
    },
  )
}
