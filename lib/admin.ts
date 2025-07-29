import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  where,
  startAfter,
  writeBatch,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore"
import { db } from "./firebase"
import type { UrlData, AnalyticsData } from "./analytics-clean"

export interface AdminUrlData extends UrlData {
  id: string
  clicks: number
  lastClickAt?: any
}

export interface PaginationInfo {
  hasMore: boolean
  lastDoc?: QueryDocumentSnapshot<DocumentData>
  total: number
}

// Get all URLs with pagination for admin
export async function getAllUrls(
  pageSize = 20,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
): Promise<{ urls: AdminUrlData[]; pagination: PaginationInfo }> {
  try {
    let urlsQuery = query(collection(db, "urls"), orderBy("createdAt", "desc"), limit(pageSize))

    if (lastDoc) {
      urlsQuery = query(collection(db, "urls"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(pageSize))
    }

    const urlsSnapshot = await getDocs(urlsQuery)
    const urls: AdminUrlData[] = []

    // Get analytics data for each URL
    for (const urlDoc of urlsSnapshot.docs) {
      const urlData = urlDoc.data() as UrlData

      // Get analytics data
      const analyticsRef = doc(db, "analytics", urlDoc.id)
      const analyticsSnap = await getDocs(query(collection(db, "analytics"), where("shortCode", "==", urlDoc.id)))

      let clicks = 0
      let lastClickAt = null

      if (!analyticsSnap.empty) {
        const analyticsData = analyticsSnap.docs[0].data() as AnalyticsData
        clicks = analyticsData.totalClicks || 0
        lastClickAt = analyticsData.lastClickAt
      }

      urls.push({
        ...urlData,
        id: urlDoc.id,
        clicks,
        lastClickAt,
      })
    }

    // Check if there are more documents
    const hasMore = urlsSnapshot.docs.length === pageSize
    const newLastDoc = urlsSnapshot.docs[urlsSnapshot.docs.length - 1]

    return {
      urls,
      pagination: {
        hasMore,
        lastDoc: newLastDoc,
        total: urls.length,
      },
    }
  } catch (error) {
    console.error("Error getting all URLs:", error)
    throw error
  }
}

// Search URLs by shortCode or originalUrl
export async function searchUrls(searchTerm: string): Promise<AdminUrlData[]> {
  try {
    const urls: AdminUrlData[] = []

    // Search by shortCode (exact match)
    const shortCodeQuery = query(collection(db, "urls"), where("shortCode", "==", searchTerm), limit(10))

    const shortCodeSnapshot = await getDocs(shortCodeQuery)

    for (const urlDoc of shortCodeSnapshot.docs) {
      const urlData = urlDoc.data() as UrlData

      // Get analytics data
      const analyticsRef = doc(db, "analytics", urlDoc.id)
      const analyticsSnap = await getDocs(query(collection(db, "analytics"), where("shortCode", "==", urlDoc.id)))

      let clicks = 0
      let lastClickAt = null

      if (!analyticsSnap.empty) {
        const analyticsData = analyticsSnap.docs[0].data() as AnalyticsData
        clicks = analyticsData.totalClicks || 0
        lastClickAt = analyticsData.lastClickAt
      }

      urls.push({
        ...urlData,
        id: urlDoc.id,
        clicks,
        lastClickAt,
      })
    }

    // Search by originalUrl (contains search term)
    const urlQuery = query(collection(db, "urls"), orderBy("originalUrl"), limit(10))

    const urlSnapshot = await getDocs(urlQuery)

    for (const urlDoc of urlSnapshot.docs) {
      const urlData = urlDoc.data() as UrlData

      // Filter by search term in originalUrl
      if (urlData.originalUrl.toLowerCase().includes(searchTerm.toLowerCase())) {
        // Check if already added by shortCode search
        if (!urls.find((u) => u.id === urlDoc.id)) {
          // Get analytics data
          const analyticsRef = doc(db, "analytics", urlDoc.id)
          const analyticsSnap = await getDocs(query(collection(db, "analytics"), where("shortCode", "==", urlDoc.id)))

          let clicks = 0
          let lastClickAt = null

          if (!analyticsSnap.empty) {
            const analyticsData = analyticsSnap.docs[0].data() as AnalyticsData
            clicks = analyticsData.totalClicks || 0
            lastClickAt = analyticsData.lastClickAt
          }

          urls.push({
            ...urlData,
            id: urlDoc.id,
            clicks,
            lastClickAt,
          })
        }
      }
    }

    return urls
  } catch (error) {
    console.error("Error searching URLs:", error)
    throw error
  }
}

// Deactivate a URL
export async function deactivateUrl(shortCode: string): Promise<void> {
  try {
    const urlRef = doc(db, "urls", shortCode)
    await updateDoc(urlRef, {
      isActive: false,
      deactivatedAt: new Date(),
    })

    console.log(`✅ URL deactivated: ${shortCode}`)
  } catch (error) {
    console.error("❌ Error deactivating URL:", error)
    throw error
  }
}

// Reactivate a URL
export async function reactivateUrl(shortCode: string): Promise<void> {
  try {
    const urlRef = doc(db, "urls", shortCode)
    await updateDoc(urlRef, {
      isActive: true,
      reactivatedAt: new Date(),
    })

    console.log(`✅ URL reactivated: ${shortCode}`)
  } catch (error) {
    console.error("❌ Error reactivating URL:", error)
    throw error
  }
}

// Get admin statistics
export async function getAdminStats(): Promise<{
  totalUrls: number
  activeUrls: number
  inactiveUrls: number
  totalClicks: number
}> {
  try {
    // Get all URLs
    const urlsQuery = query(collection(db, "urls"))
    const urlsSnapshot = await getDocs(urlsQuery)

    let activeUrls = 0
    let inactiveUrls = 0

    urlsSnapshot.docs.forEach((doc) => {
      const data = doc.data() as UrlData
      if (data.isActive) {
        activeUrls++
      } else {
        inactiveUrls++
      }
    })

    // Get total clicks from analytics
    const analyticsQuery = query(collection(db, "analytics"))
    const analyticsSnapshot = await getDocs(analyticsQuery)

    let totalClicks = 0
    analyticsSnapshot.docs.forEach((doc) => {
      const data = doc.data() as AnalyticsData
      totalClicks += data.totalClicks || 0
    })

    return {
      totalUrls: urlsSnapshot.docs.length,
      activeUrls,
      inactiveUrls,
      totalClicks,
    }
  } catch (error) {
    console.error("Error getting admin stats:", error)
    throw error
  }
}

// Remove all clicks related data from all collections
export async function removeAllClicksData(): Promise<{
  success: boolean
  deletedCounts: {
    urls: number
    analytics: number
    clicks: number
    subcollections: number
  }
  error?: string
}> {
  try {
    console.log("🧹 Starting removal of all clicks related data...")

    const deletedCounts = {
      urls: 0,
      analytics: 0,
      clicks: 0,
      subcollections: 0,
    }

    // Get all documents from each collection
    const [urlsSnapshot, analyticsSnapshot, clicksSnapshot] = await Promise.all([
      getDocs(collection(db, "urls")),
      getDocs(collection(db, "analytics")),
      getDocs(collection(db, "clicks")),
    ])

    // Process in batches to avoid Firestore limits
    const BATCH_SIZE = 500
    let batch = writeBatch(db)
    let operationCount = 0

    // Helper function to commit batch if needed
    const commitBatchIfNeeded = async () => {
      if (operationCount >= BATCH_SIZE) {
        await batch.commit()
        batch = writeBatch(db)
        operationCount = 0
      }
    }

    // Delete all URLs documents
    console.log(`🔄 Deleting ${urlsSnapshot.docs.length} URL documents...`)
    for (const urlDoc of urlsSnapshot.docs) {
      batch.delete(urlDoc.ref)
      operationCount++
      deletedCounts.urls++
      await commitBatchIfNeeded()
    }

    // Delete all analytics documents
    console.log(`🔄 Deleting ${analyticsSnapshot.docs.length} analytics documents...`)
    for (const analyticsDoc of analyticsSnapshot.docs) {
      batch.delete(analyticsDoc.ref)
      operationCount++
      deletedCounts.analytics++
      await commitBatchIfNeeded()
    }

    // Delete all clicks documents and their subcollections
    console.log(`🔄 Deleting ${clicksSnapshot.docs.length} clicks documents and subcollections...`)
    for (const clickDoc of clicksSnapshot.docs) {
      const shortCode = clickDoc.id

      // Delete subcollection documents first
      try {
        const subcollectionRef = collection(db, "clicks", shortCode, "shortcode_clicks")
        const subcollectionSnapshot = await getDocs(subcollectionRef)

        for (const subDoc of subcollectionSnapshot.docs) {
          batch.delete(subDoc.ref)
          operationCount++
          deletedCounts.subcollections++
          await commitBatchIfNeeded()
        }
      } catch (subcollectionError) {
        console.warn(`⚠️ Could not delete subcollection for ${shortCode}:`, subcollectionError)
      }

      // Delete main clicks document
      batch.delete(clickDoc.ref)
      operationCount++
      deletedCounts.clicks++
      await commitBatchIfNeeded()
    }

    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit()
    }

    console.log("✅ All clicks related data removed successfully!")
    console.log(`📊 Deletion summary:`)
    console.log(`   - URLs: ${deletedCounts.urls}`)
    console.log(`   - Analytics: ${deletedCounts.analytics}`)
    console.log(`   - Clicks: ${deletedCounts.clicks}`)
    console.log(`   - Subcollections: ${deletedCounts.subcollections}`)

    return {
      success: true,
      deletedCounts,
    }
  } catch (error) {
    console.error("❌ Error removing all clicks data:", error)
    return {
      success: false,
      deletedCounts: {
        urls: 0,
        analytics: 0,
        clicks: 0,
        subcollections: 0,
      },
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
