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
}

// Create short URL - using new unified structure
export async function createShortUrl(shortCode: string, originalUrl: string, metadata?: any): Promise<void> {
  try {
    console.log(`Creating short URL: ${shortCode} -> ${originalUrl}`)

    const urlRef = doc(db, "urls", shortCode)

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

    await setDoc(urlRef, urlData)

    console.log(`✅ URL created with unified structure: ${shortCode}`)
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
      return null
    }

    const data = urlSnap.data() as UrlData

    if ((data.expiresAt && data.expiresAt.toDate() < new Date()) || !data.isActive) {
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

// Record click - update unified structure and create detailed click document
export async function recordClick(
  shortCode: string,
  userAgent: string,
  referer: string,
  ip: string,
  headers?: Record<string, string>,
): Promise<void> {
  try {
    const urlRef = doc(db, "urls", shortCode)
    const clicksRef = collection(db, "urls", shortCode, "clicks")

    await runTransaction(db, async (transaction) => {
      const urlDoc = await transaction.get(urlRef)

      if (urlDoc.exists()) {
        // Update the main URL document with click count and last click time
        transaction.update(urlRef, {
          totalClicks: increment(1),
          lastClickAt: serverTimestamp(),
        })

        // Create detailed click document in subcollection
        const clickData: Omit<IndividualClickData, "id"> = {
          timestamp: serverTimestamp(),
          shortCode,
          Host: headers?.["host"] || headers?.["Host"],
          "User-Agent": userAgent || headers?.["user-agent"] || headers?.["User-Agent"],
          Accept: headers?.["accept"] || headers?.["Accept"],
          "Accept-Language": headers?.["accept-language"] || headers?.["Accept-Language"],
          "Accept-Encoding": headers?.["accept-encoding"] || headers?.["Accept-Encoding"],
          "Accept-Charset": headers?.["accept-charset"] || headers?.["Accept-Charset"],
          "Content-Type": headers?.["content-type"] || headers?.["Content-Type"],
          "Content-Length": headers?.["content-length"] || headers?.["Content-Length"],
          Authorization: headers?.["authorization"] || headers?.["Authorization"],
          Cookie: headers?.["cookie"] || headers?.["Cookie"],
          Referer: referer || headers?.["referer"] || headers?.["Referer"],
          Origin: headers?.["origin"] || headers?.["Origin"],
          Connection: headers?.["connection"] || headers?.["Connection"],
          "Upgrade-Insecure-Requests": headers?.["upgrade-insecure-requests"] || headers?.["Upgrade-Insecure-Requests"],
          "Cache-Control": headers?.["cache-control"] || headers?.["Cache-Control"],
          Pragma: headers?.["pragma"] || headers?.["Pragma"],
          "If-Modified-Since": headers?.["if-modified-since"] || headers?.["If-Modified-Since"],
          "If-None-Match": headers?.["if-none-match"] || headers?.["If-None-Match"],
          Range: headers?.["range"] || headers?.["Range"],
          TE: headers?.["te"] || headers?.["TE"],
          "Transfer-Encoding": headers?.["transfer-encoding"] || headers?.["Transfer-Encoding"],
          Expect: headers?.["expect"] || headers?.["Expect"],
          "X-Requested-With": headers?.["x-requested-with"] || headers?.["X-Requested-With"],
          "X-Forwarded-For": ip || headers?.["x-forwarded-for"] || headers?.["X-Forwarded-For"],
        }

        // Add the click document to the subcollection (outside transaction since addDoc doesn't work in transactions)
        // We'll do this after the transaction
        setTimeout(async () => {
          try {
            await addDoc(clicksRef, clickData)
            console.log(`✅ Detailed click document created for: ${shortCode}`)
          } catch (error) {
            console.error("❌ Error creating detailed click document:", error)
          }
        }, 0)
      } else {
        // Create URL document if it doesn't exist (shouldn't happen normally)
        transaction.set(urlRef, {
          shortCode,
          totalClicks: 1,
          createdAt: serverTimestamp(),
          lastClickAt: serverTimestamp(),
          isActive: true,
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
          originalUrl: "", // This would need to be provided
        })
      }
    })

    console.log(`✅ Click recorded in unified structure: ${shortCode}`)
  } catch (error) {
    console.error("❌ Error recording click:", error)
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
