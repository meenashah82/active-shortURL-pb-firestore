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
  "User-Agent"?: string
  "X-Forwarded-For"?: string
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

    console.log(`📖 URL data retrieved: ${shortCode}`)
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
      "User-Agent": headers["user-agent"] || userAgent,
      referer: headers["referer"] || referer,
      "X-Forwarded-For": headers["x-forwarded-for"] || ip,
      userAgent: headers["user-agent"] || userAgent,
      ip: headers["x-forwarded-for"] || ip,
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
      where("_placeholder", "!=", true),
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

// Subscribe to top URLs
export function subscribeToTopUrls(
  callback: (urls: Array<{ shortCode: string; clicks: number; originalUrl: string }>) => void,
  limitCount = 10,
): () => void {
  const urlsQuery = query(
    collection(db, "urls"),
    where("isActive", "==", true),
    orderBy("totalClicks", "desc"),
    limit(limitCount),
  )

  return onSnapshot(
    urlsQuery,
    {
      includeMetadataChanges: true,
    },
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
