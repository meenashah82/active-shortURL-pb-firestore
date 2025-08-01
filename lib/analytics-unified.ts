import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  arrayUnion,
  serverTimestamp,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export interface ClickEvent {
  timestamp: Timestamp
  userAgent?: string
  referer?: string
  ip?: string
}

export interface UnifiedUrlData {
  shortCode: string
  originalUrl: string
  createdAt: Timestamp
  isActive: boolean
  totalClicks: number
  lastClickAt?: Timestamp
  clickEvents: ClickEvent[]
}

export async function getUnifiedAnalytics(shortCode: string): Promise<UnifiedUrlData | null> {
  try {
    const urlDoc = await getDoc(doc(db, "urls", shortCode))

    if (!urlDoc.exists()) {
      return null
    }

    const data = urlDoc.data()
    return {
      shortCode,
      originalUrl: data.originalUrl,
      createdAt: data.createdAt,
      isActive: data.isActive,
      totalClicks: data.totalClicks || 0,
      lastClickAt: data.lastClickAt,
      clickEvents: data.clickEvents || [],
    }
  } catch (error) {
    console.error("Error getting unified analytics:", error)
    return null
  }
}

export async function trackClick(shortCode: string, clickData: Omit<ClickEvent, "timestamp"> = {}) {
  try {
    const urlRef = doc(db, "urls", shortCode)

    const clickEvent: ClickEvent = {
      timestamp: serverTimestamp() as Timestamp,
      ...clickData,
    }

    await updateDoc(urlRef, {
      totalClicks: increment(1),
      lastClickAt: serverTimestamp(),
      clickEvents: arrayUnion(clickEvent),
    })
  } catch (error) {
    console.error("Error tracking click:", error)
    throw error
  }
}

export async function getTopUrls(limitCount = 10): Promise<UnifiedUrlData[]> {
  try {
    const q = query(
      collection(db, "urls"),
      where("totalClicks", ">", 0),
      orderBy("totalClicks", "desc"),
      limit(limitCount),
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(
      (doc) =>
        ({
          shortCode: doc.id,
          ...doc.data(),
        }) as UnifiedUrlData,
    )
  } catch (error) {
    console.error("Error getting top URLs:", error)
    return []
  }
}

export function subscribeToTopUrls(limitCount = 10, callback: (urls: UnifiedUrlData[]) => void): () => void {
  const q = query(
    collection(db, "urls"),
    where("totalClicks", ">", 0),
    orderBy("totalClicks", "desc"),
    limit(limitCount),
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const urls = snapshot.docs.map(
        (doc) =>
          ({
            shortCode: doc.id,
            ...doc.data(),
          }) as UnifiedUrlData,
      )
      callback(urls)
    },
    (error) => {
      console.error("Error in subscribeToTopUrls:", error)
      callback([])
    },
  )
}

export function subscribeToUrlAnalytics(
  shortCode: string,
  callback: (data: UnifiedUrlData | null) => void,
): () => void {
  const urlRef = doc(db, "urls", shortCode)

  return onSnapshot(
    urlRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        callback({
          shortCode,
          originalUrl: data.originalUrl,
          createdAt: data.createdAt,
          isActive: data.isActive,
          totalClicks: data.totalClicks || 0,
          lastClickAt: data.lastClickAt,
          clickEvents: data.clickEvents || [],
        })
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error("Error in subscribeToUrlAnalytics:", error)
      callback(null)
    },
  )
}
