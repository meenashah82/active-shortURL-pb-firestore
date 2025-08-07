import { getFirestore } from "./firebase"
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  where
} from "firebase/firestore"

export interface UrlData {
  shortCode: string
  originalUrl: string
  createdAt: any
  totalClicks: number
  isActive: boolean
}

export interface ClickEvent {
  timestamp: any
  userAgent?: string
  referer?: string
  ip?: string
}

// Create a new short URL
export async function createShortUrl(shortCode: string, originalUrl: string): Promise<void> {
  const db = getFirestore()
  
  console.log(`📝 Creating short URL: ${shortCode} -> ${originalUrl}`)
  
  try {
    // Check if short code already exists
    const urlDoc = await getDoc(doc(db, "urls", shortCode))
    if (urlDoc.exists()) {
      throw new Error(`Short code ${shortCode} already exists`)
    }

    // Create the URL document
    const urlData: UrlData = {
      shortCode,
      originalUrl,
      createdAt: serverTimestamp(),
      totalClicks: 0,
      isActive: true
    }

    await setDoc(doc(db, "urls", shortCode), urlData)
    console.log(`✅ Short URL created successfully: ${shortCode}`)
  } catch (error) {
    console.error(`❌ Error creating short URL:`, error)
    throw error
  }
}

// Get URL data
export async function getUrlData(shortCode: string): Promise<UrlData | null> {
  const db = getFirestore()
  
  try {
    const urlDoc = await getDoc(doc(db, "urls", shortCode))
    
    if (!urlDoc.exists()) {
      return null
    }

    return urlDoc.data() as UrlData
  } catch (error) {
    console.error(`❌ Error getting URL data for ${shortCode}:`, error)
    return null
  }
}

// Track a click
export async function trackClick(shortCode: string, clickData: Partial<ClickEvent> = {}): Promise<void> {
  const db = getFirestore()
  
  try {
    // Update total clicks count
    await updateDoc(doc(db, "urls", shortCode), {
      totalClicks: increment(1)
    })

    // Add click event to subcollection
    const clickEvent: ClickEvent = {
      timestamp: serverTimestamp(),
      ...clickData
    }

    await setDoc(doc(db, "urls", shortCode, "clicks", Date.now().toString()), clickEvent)
    
    console.log(`📊 Click tracked for ${shortCode}`)
  } catch (error) {
    console.error(`❌ Error tracking click for ${shortCode}:`, error)
    throw error
  }
}

// Get recent URLs
export async function getRecentUrls(limitCount: number = 10): Promise<UrlData[]> {
  const db = getFirestore()
  
  try {
    const q = query(
      collection(db, "urls"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    )
    
    const snapshot = await getDocs(q)
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
export async function getUrlAnalytics(shortCode: string) {
  const db = getFirestore()
  
  try {
    // Get URL data
    const urlData = await getUrlData(shortCode)
    if (!urlData) {
      return null
    }

    // Get click events
    const clicksQuery = query(
      collection(db, "urls", shortCode, "clicks"),
      orderBy("timestamp", "desc"),
      limit(100)
    )
    
    const clicksSnapshot = await getDocs(clicksQuery)
    const clicks: ClickEvent[] = []
    
    clicksSnapshot.forEach((doc) => {
      clicks.push(doc.data() as ClickEvent)
    })

    return {
      ...urlData,
      clicks
    }
  } catch (error) {
    console.error(`❌ Error getting analytics for ${shortCode}:`, error)
    return null
  }
}

// Enhanced real-time listener for analytics data
export function subscribeToAnalytics(shortCode: string, callback: (data: UrlData | null) => void): () => void {
  const db = getFirestore()
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

// Get recent clicks across all URLs (for dashboard)
export function subscribeToRecentClicks(
  callback: (clicks: Array<ClickEvent & { shortCode: string }>) => void,
  limitCount = 50,
): () => void {
  const db = getFirestore()
  const analyticsQuery = query(
    collection(db, "urls"),
    where("totalClicks", ">", 0),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  )

  return onSnapshot(
    analyticsQuery,
    {
      includeMetadataChanges: true,
    },
    async (snapshot) => {
      const recentClicks: Array<ClickEvent & { shortCode: string }> = []

      for (const doc of snapshot.docs) {
        const urlData = doc.data() as UrlData
        const clicksQuery = query(
          collection(db, "urls", urlData.shortCode, "clicks"),
          orderBy("timestamp", "desc"),
          limit(5)
        )
        const clicksSnapshot = await getDocs(clicksQuery)
        clicksSnapshot.forEach((clickDoc) => {
          const clickData = clickDoc.data() as ClickEvent
          recentClicks.push({ ...clickData, shortCode: urlData.shortCode })
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

// Get top performing URLs
export function subscribeToTopUrls(
  callback: (urls: Array<{ shortCode: string; clicks: number; originalUrl: string }>) => void,
  limitCount = 10,
): () => void {
  const db = getFirestore()
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
