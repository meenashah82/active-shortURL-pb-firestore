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
  deleteDoc,
  writeBatch,
} from "firebase/firestore"
import { db } from "./firebase"

export interface ClickEvent {
  timestamp: any
  userAgent?: string
  referer?: string
  ip?: string
  country?: string
  city?: string
  id?: string
  clickSource?: "direct" | "analytics_page" | "test"
  sessionId?: string
}

// Updated URL data structure - now contains all data including clicks
export interface UrlData {
  originalUrl: string
  shortCode: string
  createdAt: any
  isActive: boolean
  expiresAt?: any
  lastClickAt?: any
}

// Analytics data interface for backward compatibility
export interface AnalyticsData {
  shortCode: string
  totalClicks: number
  createdAt: any
  lastClickAt?: any
  clickEvents: ClickEvent[]
}

// Clicks collection data structure (kept for backward compatibility)
export interface ClicksData {
  shortCode: string
  createdAt: any
  isActive: boolean
}

// Individual click document structure for clicks subcollection
export interface IndividualClickData {
  id: string
  timestamp: any
  shortCode: string
  Host?: string
  "User-Agent"?: string
  Accept?: string
  "Accept-Language"?: string
  "Accept-Encoding"?: string
  "Accept-Charset"?: string
  "Content-Type"?: string
  "Content-Length"?: string
  Authorization?: string
  Cookie?: string
  Referer?: string
  Origin?: string
  Connection?: string
  "Upgrade-Insecure-Requests"?: string
  "Cache-Control"?: string
  Pragma?: string
  "If-Modified-Since"?: string
  "If-None-Match"?: string
  Range?: string
  TE?: string
  "Transfer-Encoding"?: string
  Expect?: string
  "X-Requested-With"?: string
  "X-Forwarded-For"?: string
  _placeholder?: boolean
}

// Generate unique click ID
function generateClickId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  const clickId = `click_${timestamp}_${randomPart}`
  console.log(`🆔 generateClickId: Generated ID: ${clickId}`)
  return clickId
}

// Helper function to extract header value with case-insensitive lookup
function getHeaderValue(headers: Record<string, string> | undefined, headerName: string): string | undefined {
  if (!headers) return undefined

  // Try exact match first
  if (headers[headerName]) return headers[headerName]

  // Try lowercase version
  const lowerHeaderName = headerName.toLowerCase()
  if (headers[lowerHeaderName]) return headers[lowerHeaderName]

  // Try to find case-insensitive match
  const foundKey = Object.keys(headers).find((key) => key.toLowerCase() === lowerHeaderName)
  return foundKey ? headers[foundKey] : undefined
}

// Create short URL - using new unified structure and create clicks subcollection
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

    const analyticsRef = doc(db, "analytics", shortCode)
    const analyticsSnap = await getDoc(analyticsRef)
    
    if (analyticsSnap.exists()) {
      console.log(`⚠️ Analytics already exists: ${shortCode}`)
      throw new Error(`Analytics for ${shortCode} already exists`)
    }

    // Create new documents only if they don't exist
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

    const urlData: UrlData = {
      originalUrl,
      shortCode,
      createdAt: serverTimestamp(),
      isActive: true,
      expiresAt: Timestamp.fromDate(expiresAt),
    }

    const analyticsData: AnalyticsData = {
      shortCode,
      totalClicks: 0,
      createdAt: serverTimestamp(),
      clickEvents: [],
    }

    // Use setDoc to create new documents
    await Promise.all([
      setDoc(urlRef, urlData),
      setDoc(analyticsRef, analyticsData)
    ])
    
    console.log(`✅ Short URL created successfully: ${shortCode}`)
  } catch (error) {
    console.error("❌ Error creating short URL:", error)
    throw error
  }
}

// Get URL data from unified structure
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

// Get click count from unified structure
export async function getClickCount(shortCode: string): Promise<number> {
  try {
    const analyticsData = await getAnalyticsData(shortCode)
    return analyticsData?.totalClicks || 0
  } catch (error) {
    console.error("Error getting click count:", error)
    return 0
  }
}

// Get complete URL info with click count
export async function getUrlWithAnalytics(shortCode: string): Promise<{
  url: UrlData | null
  clicks: number
  analytics: AnalyticsData | null
}> {
  try {
    const urlData = await getUrlData(shortCode)
    const analyticsData = await getAnalyticsData(shortCode)

    if (!urlData || !analyticsData) {
      return { url: null, clicks: 0, analytics: null }
    }

    return {
      url: urlData,
      clicks: analyticsData.totalClicks,
      analytics: analyticsData,
    }
  } catch (error) {
    console.error("Error getting URL with analytics:", error)
    return { url: null, clicks: 0, analytics: null }
  }
}

// Get analytics data from unified structure (for backward compatibility)
export async function getAnalyticsData(shortCode: string): Promise<AnalyticsData | null> {
  try {
    console.log(`📊 Getting analytics data for: ${shortCode}`)
    const analyticsRef = doc(db, "analytics", shortCode)
    const analyticsSnap = await getDoc(analyticsRef)

    if (!analyticsSnap.exists()) {
      console.log(`📊 Analytics document not found: ${shortCode}`)
      return null
    }

    const data = analyticsSnap.data() as AnalyticsData
    console.log(`📊 Analytics data retrieved: ${shortCode}`)
    return data
  } catch (error) {
    console.error("❌ Error getting analytics data:", error)
    return null
  }
}

// Get click history from clicks subcollection
export async function getClickHistory(shortCode: string, limitCount = 50): Promise<ClickEvent[]> {
  try {
    console.log(`📊 Fetching click history for: ${shortCode}`)

    const analyticsRef = doc(db, "analytics", shortCode)
    const analyticsSnap = await getDoc(analyticsRef)

    if (!analyticsSnap.exists()) {
      console.log(`📊 No analytics document found for: ${shortCode}`)
      return []
    }

    const data = analyticsSnap.data() as AnalyticsData
    const clickHistory = data.clickEvents || []

    console.log(`📊 Found ${clickHistory.length} click records for: ${shortCode}`)
    return clickHistory.slice(-limitCount)
  } catch (error) {
    console.error("❌ Error getting click history:", error)
    return []
  }
}

// Real-time subscription to click history
export function subscribeToClickHistory(
  shortCode: string,
  callback: (clicks: ClickEvent[]) => void,
): () => void {
  const analyticsRef = doc(db, "analytics", shortCode)

  return onSnapshot(
    analyticsRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data() as AnalyticsData
        callback(data.clickEvents || [])
      } else {
        callback([])
      }
    },
    (error) => {
      console.error("Error in click history subscription:", error)
      callback([])
    },
  )
}

// Record click - Creates individual click document in subcollection AND increments totalClicks
export async function recordClick(
  shortCode: string,
  clickData: Partial<ClickEvent> = {}
): Promise<void> {
  try {
    console.log(`🖱️ Recording click for: ${shortCode}`)

    const analyticsRef = doc(db, "analytics", shortCode)
    
    // Check if analytics document exists
    const analyticsSnap = await getDoc(analyticsRef)
    if (!analyticsSnap.exists()) {
      console.log(`⚠️ Analytics document doesn't exist for: ${shortCode}`)
      return
    }

    const clickEvent: ClickEvent = {
      timestamp: serverTimestamp(),
      userAgent: clickData.userAgent || "Unknown",
      referer: clickData.referer || "Direct",
      ip: clickData.ip || "Unknown",
      country: clickData.country || "Unknown",
      city: clickData.city || "Unknown",
      clickSource: clickData.clickSource || "direct",
      sessionId: clickData.sessionId || `session_${Date.now()}`,
      id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    // Get current analytics data
    const currentData = analyticsSnap.data() as AnalyticsData
    const currentClickEvents = currentData.clickEvents || []

    // Add new click event to the array
    const updatedClickEvents = [...currentClickEvents, clickEvent]

    // Update analytics document
    await updateDoc(analyticsRef, {
      totalClicks: increment(1),
      lastClickAt: serverTimestamp(),
      clickEvents: updatedClickEvents,
    })

    console.log(`✅ Click recorded successfully for: ${shortCode}`)
  } catch (error) {
    console.error("❌ Error recording click:", error)
    throw error
  }
}

// Real-time subscription to analytics from unified structure
export function subscribeToAnalytics(shortCode: string, callback: (data: AnalyticsData | null) => void): () => void {
  const analyticsRef = doc(db, "analytics", shortCode)

  console.log(`🔄 Starting real-time analytics subscription for: ${shortCode}`)

  return onSnapshot(
    analyticsRef,
    {
      includeMetadataChanges: true,
    },
    async (doc) => {
      if (doc.exists()) {
        const data = doc.data() as AnalyticsData
        console.log("📡 Analytics update received:", {
          shortCode,
          totalClicks: data.totalClicks,
          clickEventsCount: data.clickEvents?.length || 0,
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

// Subscribe to recent clicks - READ ONLY
export function subscribeToRecentClicks(
  callback: (clicks: Array<ClickEvent & { shortCode: string }>) => void,
  limitCount = 50,
): () => void {
  const analyticsQuery = query(
    collection(db, "analytics"),
    where("totalClicks", ">", 0),
    orderBy("totalClicks", "desc"),
    limit(limitCount),
  )

  return onSnapshot(
    analyticsQuery,
    {
      includeMetadataChanges: true,
    },
    (snapshot) => {
      const recentClicks: Array<ClickEvent & { shortCode: string }> = []

      snapshot.forEach((doc) => {
        const data = doc.data() as AnalyticsData
        if (data.clickEvents && data.clickEvents.length > 0) {
          const recentUrlClicks = data.clickEvents.slice(-5).map((click) => ({
            ...click,
            shortCode: data.shortCode,
          }))
          recentClicks.push(...recentUrlClicks)
        }
      })

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

// Subscribe to top URLs - READ ONLY
export function subscribeToTopUrls(
  callback: (urls: Array<{ shortCode: string; clicks: number; originalUrl: string }>) => void,
  limitCount = 10,
): () => void {
  const urlsQuery = query(
    collection(db, "urls"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
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

        // Get click count from analytics
        const analyticsRef = doc(db, "analytics", urlData.shortCode)
        const analyticsSnap = await getDoc(analyticsRef)
        const clicks = analyticsSnap.exists() ? (analyticsSnap.data() as AnalyticsData).totalClicks || 0 : 0

        urls.push({
          shortCode: urlData.shortCode,
          clicks,
          originalUrl: urlData.originalUrl,
        })
      }

      // Sort by clicks descending
      urls.sort((a, b) => b.clicks - a.clicks)

      callback(urls.slice(0, limitCount))
    },
    (error) => {
      console.error("Error in top URLs subscription:", error)
      callback([])
    },
  )
}

// Migration functions (kept for backward compatibility but may not be needed)
export async function migrateToCleanArchitecture(): Promise<void> {
  console.log("🧹 Migration not needed - already using unified structure")
}

export async function migrateToClicksCollection(): Promise<void> {
  console.log("🔄 Starting migration to clicks collection...")
  // This is a safe no-op function to prevent accidental data loss
  console.log("⚠️ Migration disabled to prevent data loss")
}

export async function migrateRemoveClickEvents(): Promise<void> {
  console.log("🔄 Starting migration to remove click events...")
  // This is a safe no-op function to prevent accidental data loss
  console.log("⚠️ Migration disabled to prevent data loss")
}

export async function migrateToShortcodeClicksSubcollections(): Promise<void> {
  console.log("🔄 Starting migration to shortcode clicks subcollections...")
  // This is a safe no-op function to prevent accidental data loss
  console.log("⚠️ Migration disabled to prevent data loss")
}
