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
import type { UrlData } from "./analytics-clean"

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

// Get all URLs with pagination for admin - using unified structure
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

    urlsSnapshot.forEach((urlDoc) => {
      const urlData = urlDoc.data() as UrlData

      urls.push({
        ...urlData,
        id: urlDoc.id,
        clicks: urlData.totalClicks || 0,
        lastClickAt: urlData.lastClickAt,
      })
    })

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

// Search URLs by shortCode or originalUrl - using unified structure
export async function searchUrls(searchTerm: string): Promise<AdminUrlData[]> {
  try {
    const urls: AdminUrlData[] = []

    // Search by shortCode (exact match)
    const shortCodeQuery = query(collection(db, "urls"), where("shortCode", "==", searchTerm), limit(10))
    const shortCodeSnapshot = await getDocs(shortCodeQuery)

    shortCodeSnapshot.forEach((urlDoc) => {
      const urlData = urlDoc.data() as UrlData
      urls.push({
        ...urlData,
        id: urlDoc.id,
        clicks: urlData.totalClicks || 0,
        lastClickAt: urlData.lastClickAt,
      })
    })

    // Search by originalUrl (contains search term)
    const urlQuery = query(collection(db, "urls"), orderBy("originalUrl"), limit(10))
    const urlSnapshot = await getDocs(urlQuery)

    urlSnapshot.forEach((urlDoc) => {
      const urlData = urlDoc.data() as UrlData

      // Filter by search term in originalUrl
      if (urlData.originalUrl.toLowerCase().includes(searchTerm.toLowerCase())) {
        // Check if already added by shortCode search
        if (!urls.find((u) => u.id === urlDoc.id)) {
          urls.push({
            ...urlData,
            id: urlDoc.id,
            clicks: urlData.totalClicks || 0,
            lastClickAt: urlData.lastClickAt,
          })
        }
      }
    })

    return urls
  } catch (error) {
    console.error("Error searching URLs:", error)
    throw error
  }
}

// Deactivate a URL - using unified structure
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

// Reactivate a URL - using unified structure
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

// Get admin statistics - using unified structure
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
    let totalClicks = 0

    urlsSnapshot.docs.forEach((doc) => {
      const data = doc.data() as UrlData
      if (data.isActive) {
        activeUrls++
      } else {
        inactiveUrls++
      }
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

// Remove all data from the new database structure
export async function removeAllClicksData(): Promise<{
  success: boolean
  deletedCounts: {
    urls: number
    clickSubcollections: number
    totalClickDocuments: number
    legacyAnalytics: number
    legacyClicks: number
  }
  error?: string
}> {
  try {
    console.log("🧹 Starting removal of all data from the database...")

    const deletedCounts = {
      urls: 0,
      clickSubcollections: 0,
      totalClickDocuments: 0,
      legacyAnalytics: 0,
      legacyClicks: 0,
    }

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

    // Step 1: Get all URLs and delete their clicks subcollections first
    console.log("🔄 Step 1: Deleting clicks subcollections...")
    const urlsSnapshot = await getDocs(collection(db, "urls"))
    
    for (const urlDoc of urlsSnapshot.docs) {
      const shortCode = urlDoc.id
      
      try {
        // Get all click documents in the subcollection
        const clicksRef = collection(db, "urls", shortCode, "clicks")
        const clicksSnapshot = await getDocs(clicksRef)
        
        if (clicksSnapshot.docs.length > 0) {
          console.log(`🔄 Deleting ${clicksSnapshot.docs.length} click documents for ${shortCode}`)
          deletedCounts.clickSubcollections++
          
          // Delete all click documents in this subcollection
          for (const clickDoc of clicksSnapshot.docs) {
            batch.delete(clickDoc.ref)
            operationCount++
            deletedCounts.totalClickDocuments++
            await commitBatchIfNeeded()
          }
        }
      } catch (subcollectionError) {
        console.warn(`⚠️ Could not delete clicks subcollection for ${shortCode}:`, subcollectionError)
      }
    }

    // Step 2: Delete all URL documents
    console.log(`🔄 Step 2: Deleting ${urlsSnapshot.docs.length} URL documents...`)
    for (const urlDoc of urlsSnapshot.docs) {
      batch.delete(urlDoc.ref)
      operationCount++
      deletedCounts.urls++
      await commitBatchIfNeeded()
    }

    // Step 3: Clean up any legacy collections if they exist
    console.log("🔄 Step 3: Cleaning up legacy collections...")
    
    try {
      const analyticsSnapshot = await getDocs(collection(db, "analytics"))
      if (analyticsSnapshot.docs.length > 0) {
        console.log(`🔄 Deleting ${analyticsSnapshot.docs.length} legacy analytics documents...`)
        for (const analyticsDoc of analyticsSnapshot.docs) {
          batch.delete(analyticsDoc.ref)
          operationCount++
          deletedCounts.legacyAnalytics++
          await commitBatchIfNeeded()
        }
      }
    } catch (error) {
      console.log("ℹ️ No legacy analytics collection found")
    }

    try {
      const clicksSnapshot = await getDocs(collection(db, "clicks"))
      if (clicksSnapshot.docs.length > 0) {
        console.log(`🔄 Deleting ${clicksSnapshot.docs.length} legacy clicks documents...`)
        for (const clickDoc of clicksSnapshot.docs) {
          const shortCode = clickDoc.id

          // Delete legacy subcollection documents first
          try {
            const subcollectionRef = collection(db, "clicks", shortCode, "shortcode_clicks")
            const subcollectionSnapshot = await getDocs(subcollectionRef)

            for (const subDoc of subcollectionSnapshot.docs) {
              batch.delete(subDoc.ref)
              operationCount++
              await commitBatchIfNeeded()
            }
          } catch (subcollectionError) {
            console.warn(`⚠️ Could not delete legacy subcollection for ${shortCode}:`, subcollectionError)
          }

          // Delete main legacy clicks document
          batch.delete(clickDoc.ref)
          operationCount++
          deletedCounts.legacyClicks++
          await commitBatchIfNeeded()
        }
      }
    } catch (error) {
      console.log("ℹ️ No legacy clicks collection found")
    }

    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit()
    }

    console.log("✅ All data removed successfully!")
    console.log(`📊 Deletion summary:`)
    console.log(`   - URL Documents: ${deletedCounts.urls}`)
    console.log(`   - URLs with Click Subcollections: ${deletedCounts.clickSubcollections}`)
    console.log(`   - Total Click Documents: ${deletedCounts.totalClickDocuments}`)
    console.log(`   - Legacy Analytics: ${deletedCounts.legacyAnalytics}`)
    console.log(`   - Legacy Clicks: ${deletedCounts.legacyClicks}`)

    return {
      success: true,
      deletedCounts,
    }
  } catch (error) {
    console.error("❌ Error removing all data:", error)
    return {
      success: false,
      deletedCounts: {
        urls: 0,
        clickSubcollections: 0,
        totalClickDocuments: 0,
        legacyAnalytics: 0,
        legacyClicks: 0,
      },
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
