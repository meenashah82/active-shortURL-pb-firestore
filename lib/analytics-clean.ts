import { getFirebase } from "./firebase"
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, Timestamp, getDocs } from "firebase/firestore"

export interface UrlData {
  shortCode: string
  originalUrl: string
  createdAt: Timestamp
  totalClicks: number
  isActive: boolean
  lastClickAt?: Timestamp
}

export interface ClickEvent {
  shortCode: string
  timestamp: Timestamp
  userAgent: string
  referer: string
  ip: string
  headers: Record<string, string>
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
  const { db } = getFirebase()
  
  if (!db) {
    throw new Error("Database connection not available")
  }

  console.log(`📝 ANALYTICS-CLEAN: Creating short URL: ${shortCode} -> ${originalUrl}`)

  const urlData: UrlData = {
    shortCode,
    originalUrl,
    createdAt: Timestamp.now(),
    totalClicks: 0,
    isActive: true,
  }

  await setDoc(doc(db, "urls", shortCode), urlData)
  console.log(`✅ ANALYTICS-CLEAN: Short URL created successfully: ${shortCode}`)
}

// Get URL data
export async function getUrlData(shortCode: string): Promise<UrlData | null> {
  const { db } = getFirebase()
  
  if (!db) {
    throw new Error("Database connection not available")
  }

  console.log(`🔍 ANALYTICS-CLEAN: Getting URL data for: ${shortCode}`)

  const docRef = doc(db, "urls", shortCode)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    console.log(`❌ ANALYTICS-CLEAN: URL not found: ${shortCode}`)
    return null
  }

  const data = docSnap.data() as UrlData
  console.log(`✅ ANALYTICS-CLEAN: URL data found: ${shortCode} -> ${data.originalUrl}`)
  return data
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
  analytics: any | null
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
export async function getAnalyticsData(shortCode: string) {
  const { db } = getFirebase()
  
  if (!db) {
    throw new Error("Database connection not available")
  }

  console.log(`📈 ANALYTICS-CLEAN: Getting analytics data for: ${shortCode}`)

  // Get URL data
  const urlData = await getUrlData(shortCode)
  if (!urlData) {
    return null
  }

  // Get click events
  const clicksRef = collection(db, "clicks")
  const clicksQuery = query(clicksRef, where("shortCode", "==", shortCode))
  const clicksSnapshot = await getDocs(clicksQuery)

  const clickEvents = clicksSnapshot.docs.map(doc => doc.data() as ClickEvent)

  return {
    url: urlData,
    clicks: clickEvents,
    totalClicks: urlData.totalClicks,
  }
}

// Real-time subscription to click history
export function subscribeToClickHistory(
  shortCode: string,
  callback: (clicks: ClickEvent[]) => void,
): () => void {
  const { db } = getFirebase()
  const clicksRef = collection(db, "clicks")
  const clicksQuery = query(clicksRef, where("shortCode", "==", shortCode))

  return onSnapshot(
    clicksQuery,
    (snapshot) => {
      const clickEvents = snapshot.docs.map(doc => doc.data() as ClickEvent)
      callback(clickEvents)
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
  userAgent: string,
  referer: string,
  ip: string,
  headers: Record<string, string>
): Promise<void> {
  const { db } = getFirebase()
  
  if (!db) {
    throw new Error("Database connection not available")
  }

  console.log(`📊 ANALYTICS-CLEAN: Recording click for: ${shortCode}`)

  const clickEvent: ClickEvent = {
    shortCode,
    timestamp: Timestamp.now(),
    userAgent,
    referer,
    ip,
    headers,
  }

  try {
    // Add click event to clicks collection
    await addDoc(collection(db, "clicks"), clickEvent)
    console.log(`✅ ANALYTICS-CLEAN: Click event added to clicks collection for: ${shortCode}`)

    // Update URL document with incremented click count
    const urlRef = doc(db, "urls", shortCode)
    await updateDoc(urlRef, {
      totalClicks: increment(1),
      lastClickAt: Timestamp.now(),
    })
    console.log(`✅ ANALYTICS-CLEAN: URL click count updated for: ${shortCode}`)
  } catch (error) {
    console.error(`❌ ANALYTICS-CLEAN: Error recording click for ${shortCode}:`, error)
    throw error
  }
}

// Real-time subscription to analytics from unified structure
export function subscribeToAnalytics(shortCode: string, callback: (data: any | null) => void): () => void {
  const { db } = getFirebase()
  const analyticsRef = doc(db, "urls", shortCode)

  console.log(`🔄 Starting real-time analytics subscription for: ${shortCode}`)

  return onSnapshot(
    analyticsRef,
    {
      includeMetadataChanges: true,
    },
    async (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UrlData
        const analyticsData = await getAnalyticsData(shortCode)
        console.log("📡 Analytics update received:", {
          shortCode,
          totalClicks: data.totalClicks,
          clickEventsCount: analyticsData?.clicks.length || 0,
        })
        callback(analyticsData)
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
  const { db } = getFirebase()
  const clicksRef = collection(db, "clicks")
  const clicksQuery = query(clicksRef, orderBy("timestamp", "desc"), limit(limitCount))

  return onSnapshot(
    clicksQuery,
    {
      includeMetadataChanges: true,
    },
    (snapshot) => {
      const recentClicks: Array<ClickEvent & { shortCode: string }> = []

      snapshot.forEach((doc) => {
        const click = doc.data() as ClickEvent
        recentClicks.push(click)
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
  const { db } = getFirebase()
  const urlsRef = collection(db, "urls")
  const urlsQuery = query(urlsRef, where("isActive", "==", true), orderBy("totalClicks", "desc"), limit(limitCount))

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
