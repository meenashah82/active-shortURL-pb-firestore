import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  runTransaction,
  getDocs,
  increment,
} from "firebase/firestore"
import { db } from "./firebase"

export interface ClickEvent {
  timestamp: any
  userAgent?: string
  referer?: string
  ip?: string
  id?: string
  clickSource?: "direct" | "analytics_page" | "test"
  sessionId?: string
}

// Unified URL data structure with analytics embedded
export interface UnifiedUrlData {
  originalUrl: string
  shortCode: string
  createdAt: any
  isActive: boolean
  expiresAt: any
  deactivatedAt?: any
  reactivatedAt?: any
  // Analytics data embedded in URL document
  totalClicks: number
  lastClickAt?: any
  clickEvents?: ClickEvent[]
}

// Individual click document structure for shortcode_clicks subcollection
export interface IndividualClickData {
  id: string
  timestamp: any
  shortCode: string
  userAgent?: string
  referer?: string
  ip?: string
  sessionId?: string
  clickSource?: "direct" | "analytics_page" | "test"
  method?: string
  url?: string
  httpVersion?: string
  host?: string
  contentType?: string
  accept?: string
  authorization?: string
  cookie?: string
  contentLength?: string
  connection?: string
  body?: string
  queryParameters?: Record<string, string>
  pathParameters?: Record<string, string>
  headers?: Record<string, string>
  geolocation?: {
    country?: string
    region?: string
    city?: string
    timezone?: string
  }
  device?: {
    type?: string
    browser?: string
    os?: string
    isMobile?: boolean
  }
}

// New Clicks collection data structure (unchanged)
export interface ClicksData {
  shortCode: string
  createdAt: any
  isActive: boolean
}

// Create short URL with embedded analytics
export async function createShortUrl(shortCode: string, originalUrl: string, metadata?: any): Promise<void> {
  try {
    console.log(`Creating unified short URL: ${shortCode} -> ${originalUrl}`)

    const urlRef = doc(db, "urls", shortCode)
    const clicksRef = doc(db, "clicks", shortCode)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Unified URL document with embedded analytics
    const urlData: UnifiedUrlData = {
      originalUrl,
      shortCode,
      createdAt: serverTimestamp(),
      isActive: true,
      expiresAt: Timestamp.fromDate(expiresAt),
      // Analytics embedded in URL document
      totalClicks: 0,
      clickEvents: [],
    }

    // Clicks collection document (for subcollection structure)
    const clicksData: ClicksData = {
      shortCode,
      createdAt: serverTimestamp(),
      isActive: true,
    }

    // Create both documents
    await Promise.all([setDoc(urlRef, urlData), setDoc(clicksRef, clicksData)])

    console.log(`✅ Unified URL structure created: ${shortCode}`)
  } catch (error) {
    console.error("❌ Error creating unified short URL:", error)
    throw error
  }
}

// Get clicks data (unchanged)
export async function getClicksData(shortCode: string): Promise<ClicksData | null> {
  try {
    const clicksRef = doc(db, "clicks", shortCode)
    const clicksSnap = await getDoc(clicksRef)

    if (!clicksSnap.exists()) {
      return null
    }

    return clicksSnap.data() as ClicksData
  } catch (error) {
    console.error("Error getting clicks data:", error)
    return null
  }
}

// Get URL data with embedded analytics
export async function getUrlData(shortCode: string): Promise<UnifiedUrlData | null> {
  try {
    const urlRef = doc(db, "urls", shortCode)
    const urlSnap = await getDoc(urlRef)

    if (!urlSnap.exists()) {
      return null
    }

    const data = urlSnap.data() as UnifiedUrlData

    if ((data.expiresAt && data.expiresAt.toDate() < new Date()) || !data.isActive) {
      return null
    }

    return data
  } catch (error) {
    console.error("Error getting unified URL data:", error)
    return null
  }
}

// Get click count from embedded analytics
export async function getClickCount(shortCode: string): Promise<number> {
  try {
    const urlData = await getUrlData(shortCode)
    return urlData?.totalClicks || 0
  } catch (error) {
    console.error("Error getting click count:", error)
    return 0
  }
}

// Get complete URL info (now all in one document)
export async function getUrlWithAnalytics(shortCode: string): Promise<{
  url: UnifiedUrlData | null
  clicks: number
  analytics: Pick<UnifiedUrlData, "totalClicks" | "lastClickAt" | "clickEvents"> | null
}> {
  try {
    const urlData = await getUrlData(shortCode)

    if (!urlData) {
      return { url: null, clicks: 0, analytics: null }
    }

    return {
      url: urlData,
      clicks: urlData.totalClicks || 0,
      analytics: {
        totalClicks: urlData.totalClicks || 0,
        lastClickAt: urlData.lastClickAt,
        clickEvents: urlData.clickEvents || [],
      },
    }
  } catch (error) {
    console.error("Error getting unified URL with analytics:", error)
    return { url: null, clicks: 0, analytics: null }
  }
}

// Get analytics data from embedded fields
export async function getAnalyticsData(
  shortCode: string,
): Promise<Pick<UnifiedUrlData, "shortCode" | "totalClicks" | "lastClickAt" | "clickEvents"> | null> {
  try {
    const urlData = await getUrlData(shortCode)

    if (!urlData) {
      return null
    }

    return {
      shortCode: urlData.shortCode,
      totalClicks: urlData.totalClicks || 0,
      lastClickAt: urlData.lastClickAt,
      clickEvents: urlData.clickEvents || [],
    }
  } catch (error) {
    console.error("Error getting embedded analytics data:", error)
    return null
  }
}

// Get click history from shortcode_clicks subcollection (unchanged)
export async function getClickHistory(shortCode: string, limitCount = 50): Promise<IndividualClickData[]> {
  try {
    console.log(`📊 Fetching click history for: ${shortCode}`)

    const shortcodeClicksRef = collection(db, "clicks", shortCode, "shortcode_clicks")
    const clickHistoryQuery = query(shortcodeClicksRef, orderBy("timestamp", "desc"), limit(limitCount))

    const querySnapshot = await getDocs(clickHistoryQuery)
    const clickHistory: IndividualClickData[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data() as IndividualClickData
      clickHistory.push({
        ...data,
        id: doc.id,
      })
    })

    console.log(`📊 Found ${clickHistory.length} click records for: ${shortCode}`)
    return clickHistory
  } catch (error) {
    console.error("❌ Error getting click history:", error)
    return []
  }
}

// Real-time subscription to click history (unchanged)
export function subscribeToClickHistory(
  shortCode: string,
  callback: (clickHistory: IndividualClickData[]) => void,
  limitCount = 50,
): () => void {
  console.log(`🔄 Subscribing to click history: ${shortCode}`)

  const shortcodeClicksRef = collection(db, "clicks", shortCode, "shortcode_clicks")
  const clickHistoryQuery = query(shortcodeClicksRef, orderBy("timestamp", "desc"), limit(limitCount))

  return onSnapshot(
    clickHistoryQuery,
    { includeMetadataChanges: true },
    (querySnapshot) => {
      const clickHistory: IndividualClickData[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data() as IndividualClickData
        clickHistory.push({
          ...data,
          id: doc.id,
        })
      })

      console.log(`📊 Click history update: ${shortCode} - ${clickHistory.length} records`)
      callback(clickHistory)
    },
    (error) => {
      console.error("❌ Click history subscription error:", error)
      callback([])
    },
  )
}

// Record click - update embedded analytics in URL document
export async function recordClick(shortCode: string, userAgent: string, referer: string, ip: string): Promise<void> {
  try {
    const urlRef = doc(db, "urls", shortCode)

    // Create click event
    const clickEvent: ClickEvent = {
      timestamp: serverTimestamp(),
      userAgent,
      referer,
      ip,
      id: `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      clickSource: "direct",
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    // Update embedded analytics in URL document
    await runTransaction(db, async (transaction) => {
      const urlDoc = await transaction.get(urlRef)

      if (urlDoc.exists()) {
        const currentData = urlDoc.data() as UnifiedUrlData
        const currentClickEvents = currentData.clickEvents || []

        transaction.update(urlRef, {
          totalClicks: increment(1),
          lastClickAt: serverTimestamp(),
          clickEvents: [...currentClickEvents, clickEvent],
        })
      } else {
        // Create URL document with analytics if it doesn't exist
        transaction.set(urlRef, {
          shortCode,
          totalClicks: 1,
          lastClickAt: serverTimestamp(),
          clickEvents: [clickEvent],
          createdAt: serverTimestamp(),
          isActive: true,
        })
      }
    })

    console.log(`✅ Click recorded in unified URL document: ${shortCode}`)
  } catch (error) {
    console.error("❌ Error recording click:", error)
    throw error
  }
}

// Real-time subscription to unified URL analytics
export function subscribeToAnalytics(
  shortCode: string,
  callback: (data: Pick<UnifiedUrlData, "shortCode" | "totalClicks" | "lastClickAt" | "clickEvents"> | null) => void,
): () => void {
  const urlRef = doc(db, "urls", shortCode)

  console.log(`🔄 Subscribing to unified analytics: ${shortCode}`)

  return onSnapshot(
    urlRef,
    { includeMetadataChanges: true },
    (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UnifiedUrlData
        console.log(`📊 Unified analytics update: ${shortCode} - ${data.totalClicks || 0} clicks`)
        callback({
          shortCode: data.shortCode,
          totalClicks: data.totalClicks || 0,
          lastClickAt: data.lastClickAt,
          clickEvents: data.clickEvents || [],
        })
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error("❌ Unified analytics subscription error:", error)
      callback(null)
    },
  )
}

// Get top URLs by click count (from embedded analytics)
export function subscribeToTopUrls(
  callback: (urls: Array<{ shortCode: string; clicks: number; originalUrl: string }>) => void,
  limitCount = 10,
): () => void {
  // Query URLs with embedded analytics for top click counts
  const urlsQuery = query(
    collection(db, "urls"),
    where("totalClicks", ">", 0),
    orderBy("totalClicks", "desc"),
    limit(limitCount),
  )

  return onSnapshot(
    urlsQuery,
    { includeMetadataChanges: true },
    (snapshot) => {
      const topUrls: Array<{ shortCode: string; clicks: number; originalUrl: string }> = []

      snapshot.forEach((doc) => {
        const urlData = doc.data() as UnifiedUrlData
        topUrls.push({
          shortCode: urlData.shortCode,
          clicks: urlData.totalClicks || 0,
          originalUrl: urlData.originalUrl,
        })
      })

      callback(topUrls)
    },
    (error) => {
      console.error("Error in unified top URLs subscription:", error)
      callback([])
    },
  )
}

// Migration function to merge analytics into URL documents
export async function migrateAnalyticsToUrls(): Promise<void> {
  try {
    console.log("🔄 Starting migration: merging analytics into URL documents...")

    // Get all analytics documents
    const analyticsQuery = query(collection(db, "analytics"))
    const analyticsSnapshot = await getDocs(analyticsQuery)

    const migrations: Promise<void>[] = []

    analyticsSnapshot.forEach((analyticsDoc) => {
      const analyticsData = analyticsDoc.data()
      const shortCode = analyticsDoc.id

      console.log(`🔄 Migrating analytics for: ${shortCode}`)

      const migration = runTransaction(db, async (transaction) => {
        const urlRef = doc(db, "urls", shortCode)
        const urlDoc = await transaction.get(urlRef)

        if (urlDoc.exists()) {
          const urlData = urlDoc.data() as any

          // Merge analytics data into URL document
          const updatedUrlData = {
            ...urlData,
            totalClicks: analyticsData.totalClicks || 0,
            lastClickAt: analyticsData.lastClickAt,
            clickEvents: analyticsData.clickEvents || [],
          }

          transaction.set(urlRef, updatedUrlData)
          console.log(`✅ Merged analytics into URL document: ${shortCode}`)
        } else {
          console.log(`⚠️ URL document not found for analytics: ${shortCode}`)
        }
      })

      migrations.push(migration)
    })

    await Promise.all(migrations)
    console.log(`✅ Analytics migration complete: processed ${migrations.length} documents`)
    console.log("📝 Note: You can now safely delete the 'analytics' collection")
  } catch (error) {
    console.error("❌ Analytics migration error:", error)
    throw error
  }
}

// Migration function to clean up the old analytics collection
export async function cleanupAnalyticsCollection(): Promise<void> {
  try {
    console.log("🧹 Starting cleanup: removing analytics collection...")

    const analyticsQuery = query(collection(db, "analytics"))
    const analyticsSnapshot = await getDocs(analyticsQuery)

    const deletions: Promise<void>[] = []

    analyticsSnapshot.forEach((analyticsDoc) => {
      const deletion = runTransaction(db, async (transaction) => {
        transaction.delete(analyticsDoc.ref)
      })
      deletions.push(deletion)
    })

    await Promise.all(deletions)
    console.log(`✅ Analytics collection cleanup complete: deleted ${deletions.length} documents`)
  } catch (error) {
    console.error("❌ Analytics collection cleanup error:", error)
    throw error
  }
}
