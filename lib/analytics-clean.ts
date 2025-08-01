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
  addDoc,
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

// Updated URL data structure - now contains all data including clicks
export interface UrlData {
  originalUrl: string
  shortCode: string
  createdAt: any
  isActive: boolean
  expiresAt: any
  lastClickAt?: any
  totalClicks: number
}

// Analytics data interface for backward compatibility
export interface AnalyticsData {
  shortCode: string
  totalClicks: number
  createdAt: any
  lastClickAt?: any
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
  return `click_${timestamp}_${randomPart}`
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
export async function createShortUrl(shortCode: string, originalUrl: string, metadata?: any): Promise<void> {
  try {
    console.log(`Creating short URL: ${shortCode} -> ${originalUrl}`)

    const urlRef = doc(db, "urls", shortCode)
    const clicksRef = collection(db, "urls", shortCode, "clicks")

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Unified URL document with all data
    const urlData: UrlData = {
      originalUrl,
      shortCode,
      createdAt: serverTimestamp(),
      isActive: true,
      expiresAt: Timestamp.fromDate(expiresAt),
      totalClicks: 0,
      lastClickAt: null,
    }

    // Create the main URL document
    await setDoc(urlRef, urlData)

    // Create the clicks subcollection by adding an initial placeholder document
    // This ensures the subcollection exists immediately when the shortcode is created
    const placeholderClickData = {
      _placeholder: true,
      createdAt: serverTimestamp(),
      shortCode: shortCode,
      note: "This is a placeholder document to initialize the clicks subcollection",
    }

    await addDoc(clicksRef, placeholderClickData)

    console.log(`✅ URL created with unified structure: ${shortCode}`)
    console.log(`✅ Clicks subcollection created for: ${shortCode}`)
  } catch (error) {
    console.error("❌ Error creating short URL:", error)
    throw error
  }
}

// Get clicks data (for backward compatibility)
export async function getClicksData(shortCode: string): Promise<ClicksData | null> {
  try {
    const urlData = await getUrlData(shortCode)
    if (!urlData) return null

    return {
      shortCode,
      createdAt: urlData.createdAt,
      isActive: urlData.isActive,
    }
  } catch (error) {
    console.error("Error getting clicks data:", error)
    return null
  }
}

// Get URL data from unified structure
export async function getUrlData(shortCode: string): Promise<UrlData | null> {
  try {
    const urlRef = doc(db, "urls", shortCode)
    const urlSnap = await getDoc(urlRef)

    if (!urlSnap.exists()) {
      console.log(`URL document does not exist for shortCode: ${shortCode}`)
      return null
    }

    const data = urlSnap.data() as UrlData

    // Check if URL is expired or inactive
    if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
      console.log(`URL expired for shortCode: ${shortCode}`)
      return null
    }

    if (!data.isActive) {
      console.log(`URL inactive for shortCode: ${shortCode}`)
      return null
    }

    return data
  } catch (error) {
    console.error("Error getting URL data:", error)
    return null
  }
}

// Get click count from unified structure
export async function getClickCount(shortCode: string): Promise<number> {
  try {
    const urlData = await getUrlData(shortCode)
    return urlData?.totalClicks || 0
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

    if (!urlData) {
      return { url: null, clicks: 0, analytics: null }
    }

    // Create analytics data from URL data for backward compatibility
    const analyticsData: AnalyticsData = {
      shortCode: urlData.shortCode,
      totalClicks: urlData.totalClicks,
      createdAt: urlData.createdAt,
      lastClickAt: urlData.lastClickAt,
    }

    return {
      url: urlData,
      clicks: urlData.totalClicks,
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
    const urlData = await getUrlData(shortCode)

    if (!urlData) {
      return null
    }

    return {
      shortCode: urlData.shortCode,
      totalClicks: urlData.totalClicks,
      createdAt: urlData.createdAt,
      lastClickAt: urlData.lastClickAt,
    }
  } catch (error) {
    console.error("Error getting analytics data:", error)
    return null
  }
}

// Get click history from clicks subcollection
export async function getClickHistory(shortCode: string, limitCount = 50): Promise<IndividualClickData[]> {
  try {
    console.log(`📊 Fetching click history for: ${shortCode}`)

    const clicksRef = collection(db, "urls", shortCode, "clicks")
    const clickHistoryQuery = query(clicksRef, orderBy("timestamp", "desc"), limit(limitCount))

    const querySnapshot = await getDocs(clickHistoryQuery)
    const clickHistory: IndividualClickData[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data() as IndividualClickData
      // Skip placeholder documents
      if (!data._placeholder) {
        clickHistory.push({
          ...data,
          id: doc.id,
        })
      }
    })

    console.log(`📊 Found ${clickHistory.length} click records for: ${shortCode}`)
    return clickHistory
  } catch (error) {
    console.error("❌ Error getting click history:", error)
    return []
  }
}

// Real-time subscription to click history
export function subscribeToClickHistory(
  shortCode: string,
  callback: (clickHistory: IndividualClickData[]) => void,
  limitCount = 50,
): () => void {
  console.log(`🔄 Subscribing to click history: ${shortCode}`)

  const clicksRef = collection(db, "urls", shortCode, "clicks")
  const clickHistoryQuery = query(clicksRef, orderBy("timestamp", "desc"), limit(limitCount))

  return onSnapshot(
    clickHistoryQuery,
    { includeMetadataChanges: true },
    (querySnapshot) => {
      const clickHistory: IndividualClickData[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data() as IndividualClickData
        // Skip placeholder documents
        if (!data._placeholder) {
          clickHistory.push({
            ...data,
            id: doc.id,
          })
        }
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

// Record click - update unified structure and create detailed click document with unique ID
export async function recordClick(
  shortCode: string,
  userAgent: string,
  referer: string,
  ip: string,
  headers?: Record<string, string>,
): Promise<void> {
  console.log(`🔄 STARTING recordClick for shortCode: ${shortCode}`)

  try {
    // Validate Firebase connection
    if (!db) {
      throw new Error("Firebase database not initialized")
    }

    const urlRef = doc(db, "urls", shortCode)
    const clicksRef = collection(db, "urls", shortCode, "clicks")

    // Generate unique click ID
    const clickId = generateClickId()
    console.log(`🆔 Generated click ID: ${clickId}`)

    // Verify URL document exists before proceeding
    console.log(`🔍 Checking if URL document exists for shortCode: ${shortCode}`)
    const urlDoc = await getDoc(urlRef)
    if (!urlDoc.exists()) {
      throw new Error(`URL document not found for shortCode: ${shortCode}`)
    }
    console.log(`✅ URL document exists for shortCode: ${shortCode}`)

    // First, update the main URL document with click count using transaction
    console.log(`🔄 Starting transaction to update click count for shortCode: ${shortCode}`)
    await runTransaction(db, async (transaction) => {
      const urlDocInTransaction = await transaction.get(urlRef)

      if (urlDocInTransaction.exists()) {
        transaction.update(urlRef, {
          totalClicks: increment(1),
          lastClickAt: serverTimestamp(),
        })
        console.log(`✅ Transaction: Updated click count for shortCode: ${shortCode}`)
      } else {
        throw new Error(`URL document not found in transaction for shortCode: ${shortCode}`)
      }
    })

    // Create comprehensive click document with all requested header fields
    const clickData: Omit<IndividualClickData, "id"> = {
      timestamp: serverTimestamp(),
      shortCode,
      // Extract all requested header fields with case-insensitive lookup
      Host: getHeaderValue(headers, "Host"),
      "User-Agent": userAgent || getHeaderValue(headers, "User-Agent"),
      Accept: getHeaderValue(headers, "Accept"),
      "Accept-Language": getHeaderValue(headers, "Accept-Language"),
      "Accept-Encoding": getHeaderValue(headers, "Accept-Encoding"),
      "Accept-Charset": getHeaderValue(headers, "Accept-Charset"),
      "Content-Type": getHeaderValue(headers, "Content-Type"),
      "Content-Length": getHeaderValue(headers, "Content-Length"),
      Authorization: getHeaderValue(headers, "Authorization"),
      Cookie: getHeaderValue(headers, "Cookie"),
      Referer: referer || getHeaderValue(headers, "Referer"),
      Origin: getHeaderValue(headers, "Origin"),
      Connection: getHeaderValue(headers, "Connection"),
      "Upgrade-Insecure-Requests": getHeaderValue(headers, "Upgrade-Insecure-Requests"),
      "Cache-Control": getHeaderValue(headers, "Cache-Control"),
      Pragma: getHeaderValue(headers, "Pragma"),
      "If-Modified-Since": getHeaderValue(headers, "If-Modified-Since"),
      "If-None-Match": getHeaderValue(headers, "If-None-Match"),
      Range: getHeaderValue(headers, "Range"),
      TE: getHeaderValue(headers, "TE"),
      "Transfer-Encoding": getHeaderValue(headers, "Transfer-Encoding"),
      Expect: getHeaderValue(headers, "Expect"),
      "X-Requested-With": getHeaderValue(headers, "X-Requested-With"),
      "X-Forwarded-For": ip || getHeaderValue(headers, "X-Forwarded-For"),
    }

    // Create document with specific ID instead of auto-generated ID
    console.log(`🔄 Creating click document with ID: ${clickId}`)
    const clickDocRef = doc(clicksRef, clickId)
    await setDoc(clickDocRef, clickData)

    console.log(`✅ SUCCESS: Click recorded for shortCode: ${shortCode}`)
    console.log(`✅ SUCCESS: Created click document with unique ID: ${clickId}`)
    console.log(
      `📊 Click data fields populated: ${Object.keys(clickData)
        .filter((key) => clickData[key as keyof typeof clickData])
        .join(", ")}`,
    )
  } catch (error) {
    console.error(`❌ FAILED: Error recording click for shortCode: ${shortCode}`, error)
    console.error(`❌ Error details:`, {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }
}

// Real-time subscription to analytics from unified structure
export function subscribeToAnalytics(shortCode: string, callback: (data: AnalyticsData | null) => void): () => void {
  const urlRef = doc(db, "urls", shortCode)

  console.log(`🔄 Subscribing to unified analytics: ${shortCode}`)

  return onSnapshot(
    urlRef,
    { includeMetadataChanges: true },
    (doc) => {
      if (doc.exists()) {
        const urlData = doc.data() as UrlData
        const analyticsData: AnalyticsData = {
          shortCode: urlData.shortCode,
          totalClicks: urlData.totalClicks,
          createdAt: urlData.createdAt,
          lastClickAt: urlData.lastClickAt,
        }
        console.log(`📊 Unified analytics update: ${shortCode} - ${analyticsData.totalClicks} clicks`)
        callback(analyticsData)
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

// Get top URLs by click count from unified structure
export function subscribeToTopUrls(
  callback: (urls: Array<{ shortCode: string; clicks: number; originalUrl: string }>) => void,
  limitCount = 10,
): () => void {
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
        const urlData = doc.data() as UrlData
        topUrls.push({
          shortCode: urlData.shortCode,
          clicks: urlData.totalClicks,
          originalUrl: urlData.originalUrl,
        })
      })

      callback(topUrls)
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
  console.log("🔄 Migration not needed - using unified structure")
}

export async function migrateRemoveClickEvents(): Promise<void> {
  console.log("🧹 Migration not needed - using unified structure")
}

export async function migrateToShortcodeClicksSubcollections(): Promise<void> {
  console.log("🔄 Migration not needed - using unified structure")
}
