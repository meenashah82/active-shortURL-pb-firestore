import { db } from "./firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore"

// Unified URL data structure with embedded analytics
export interface UnifiedUrlData {
  shortCode: string
  originalUrl: string
  createdAt: any
  isActive: boolean
  // Embedded analytics data
  totalClicks: number
  lastClickAt: any | null
  clickEvents: ClickEvent[]
}

export interface ClickEvent {
  timestamp: any
  userAgent?: string
  referer?: string
  ip?: string
}

// Get URL with embedded analytics
export async function getUrlWithAnalytics(shortCode: string): Promise<UnifiedUrlData | null> {
  if (!db) {
    console.error("Firestore not initialized")
    return null
  }

  try {
    const urlDoc = await getDoc(doc(db, "urls", shortCode))

    if (!urlDoc.exists()) {
      return null
    }

    const data = urlDoc.data()

    // Return unified data structure
    return {
      shortCode: data.shortCode,
      originalUrl: data.originalUrl,
      createdAt: data.createdAt,
      isActive: data.isActive ?? true,
      totalClicks: data.totalClicks ?? 0,
      lastClickAt: data.lastClickAt ?? null,
      clickEvents: data.clickEvents ?? [],
    }
  } catch (error) {
    console.error("Error getting URL with analytics:", error)
    return null
  }
}

// Track click in unified structure
export async function trackClickUnified(shortCode: string, clickData: Partial<ClickEvent> = {}) {
  if (!db) {
    console.error("Firestore not initialized")
    return
  }

  try {
    const urlRef = doc(db, "urls", shortCode)
    const urlDoc = await getDoc(urlRef)

    if (!urlDoc.exists()) {
      console.error("URL not found:", shortCode)
      return
    }

    const clickEvent: ClickEvent = {
      timestamp: serverTimestamp(),
      ...clickData,
    }

    const currentData = urlDoc.data()
    const currentClickEvents = currentData.clickEvents ?? []

    // Keep only the last 100 click events to prevent document size issues
    const updatedClickEvents = [...currentClickEvents, clickEvent].slice(-100)

    await updateDoc(urlRef, {
      totalClicks: increment(1),
      lastClickAt: serverTimestamp(),
      clickEvents: updatedClickEvents,
    })

    console.log("Click tracked successfully for:", shortCode)
  } catch (error) {
    console.error("Error tracking click:", error)
  }
}

// Get all URLs with analytics (for dashboard)
export async function getAllUrlsWithAnalytics(): Promise<UnifiedUrlData[]> {
  if (!db) {
    console.error("Firestore not initialized")
    return []
  }

  try {
    const urlsCollection = collection(db, "urls")
    const urlsSnapshot = await getDocs(urlsCollection)

    return urlsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        shortCode: data.shortCode,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt,
        isActive: data.isActive ?? true,
        totalClicks: data.totalClicks ?? 0,
        lastClickAt: data.lastClickAt ?? null,
        clickEvents: data.clickEvents ?? [],
      }
    })
  } catch (error) {
    console.error("Error getting all URLs with analytics:", error)
    return []
  }
}

// Real-time subscription to URL with analytics
export function subscribeToUrlAnalytics(shortCode: string, callback: (data: UnifiedUrlData | null) => void) {
  if (!db) {
    console.error("Firestore not initialized")
    return () => {}
  }

  const urlRef = doc(db, "urls", shortCode)

  return onSnapshot(
    urlRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        callback({
          shortCode: data.shortCode,
          originalUrl: data.originalUrl,
          createdAt: data.createdAt,
          isActive: data.isActive ?? true,
          totalClicks: data.totalClicks ?? 0,
          lastClickAt: data.lastClickAt ?? null,
          clickEvents: data.clickEvents ?? [],
        })
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error("Error in real-time subscription:", error)
      callback(null)
    },
  )
}

// Subscribe to top URLs by click count (for dashboard)
export function subscribeToTopUrls(
  callback: (urls: Array<{ shortCode: string; clicks: number; originalUrl: string }>) => void,
  limitCount = 10,
): () => void {
  if (!db) {
    console.error("Firestore not initialized")
    return () => {}
  }

  // Query URLs with totalClicks > 0, ordered by totalClicks descending
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
        const urlData = doc.data()
        topUrls.push({
          shortCode: urlData.shortCode,
          clicks: urlData.totalClicks || 0,
          originalUrl: urlData.originalUrl,
        })
      })

      console.log("📊 Top URLs update:", topUrls.length, "URLs")
      callback(topUrls)
    },
    (error) => {
      console.error("Error in unified top URLs subscription:", error)
      callback([])
    },
  )
}

// Migration function to move analytics data to URLs collection
export async function migrateAnalyticsToUrls() {
  if (!db) {
    throw new Error("Firestore not initialized")
  }

  console.log("Starting migration from analytics to urls collection...")

  try {
    // Get all documents from analytics collection
    const analyticsCollection = collection(db, "analytics")
    const analyticsSnapshot = await getDocs(analyticsCollection)

    console.log(`Found ${analyticsSnapshot.docs.length} analytics documents to migrate`)

    const batch = writeBatch(db)
    let migratedCount = 0

    for (const analyticsDoc of analyticsSnapshot.docs) {
      const shortCode = analyticsDoc.id
      const analyticsData = analyticsDoc.data()

      // Get corresponding URL document
      const urlRef = doc(db, "urls", shortCode)
      const urlDoc = await getDoc(urlRef)

      if (urlDoc.exists()) {
        // Update URL document with analytics data
        batch.update(urlRef, {
          totalClicks: analyticsData.totalClicks ?? 0,
          lastClickAt: analyticsData.lastClickAt ?? null,
          clickEvents: analyticsData.clickEvents ?? [],
        })
        migratedCount++
        console.log(`Prepared migration for: ${shortCode}`)
      } else {
        console.warn(`URL document not found for shortCode: ${shortCode}`)
      }
    }

    // Commit all updates
    await batch.commit()
    console.log(`Successfully migrated ${migratedCount} analytics records to URLs collection`)

    return migratedCount
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  }
}

// Function to clean up analytics collection after migration
export async function cleanupAnalyticsCollection() {
  if (!db) {
    throw new Error("Firestore not initialized")
  }

  console.log("Starting cleanup of analytics collection...")

  try {
    const analyticsCollection = collection(db, "analytics")
    const analyticsSnapshot = await getDocs(analyticsCollection)

    console.log(`Found ${analyticsSnapshot.docs.length} analytics documents to delete`)

    const batch = writeBatch(db)
    let deletedCount = 0

    for (const analyticsDoc of analyticsSnapshot.docs) {
      batch.delete(analyticsDoc.ref)
      deletedCount++
    }

    await batch.commit()
    console.log(`Successfully deleted ${deletedCount} analytics documents`)

    return deletedCount
  } catch (error) {
    console.error("Cleanup failed:", error)
    throw error
  }
}
