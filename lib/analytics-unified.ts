import { db } from "./firebase"
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
} from "firebase/firestore"

export interface ClickEvent {
  timestamp: Date
  userAgent?: string
  referer?: string
  ip?: string
}

export interface UnifiedUrlData {
  shortCode: string
  originalUrl: string
  createdAt: Date
  isActive: boolean
  totalClicks: number
  lastClickAt: Date | null
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
      shortCode: data.shortCode,
      originalUrl: data.originalUrl,
      createdAt: data.createdAt?.toDate() || new Date(),
      isActive: data.isActive ?? true,
      totalClicks: data.totalClicks || 0,
      lastClickAt: data.lastClickAt?.toDate() || null,
      clickEvents: (data.clickEvents || []).map((event: any) => ({
        ...event,
        timestamp: event.timestamp?.toDate() || new Date(),
      })),
    }
  } catch (error) {
    console.error("Error getting unified analytics:", error)
    return null
  }
}

export async function trackClickUnified(shortCode: string, clickData: Omit<ClickEvent, "timestamp">): Promise<void> {
  try {
    const urlRef = doc(db, "urls", shortCode)
    const clickEvent: ClickEvent = {
      ...clickData,
      timestamp: new Date(),
    }

    await updateDoc(urlRef, {
      totalClicks: increment(1),
      lastClickAt: new Date(),
      clickEvents: arrayUnion(clickEvent),
    })
  } catch (error) {
    console.error("Error tracking click:", error)
    throw error
  }
}

export function subscribeToTopUrls(callback: (urls: UnifiedUrlData[]) => void, limitCount = 10): () => void {
  const q = query(
    collection(db, "urls"),
    where("totalClicks", ">", 0),
    orderBy("totalClicks", "desc"),
    limit(limitCount),
  )

  return onSnapshot(q, (snapshot) => {
    const urls: UnifiedUrlData[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      urls.push({
        shortCode: data.shortCode,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt?.toDate() || new Date(),
        isActive: data.isActive ?? true,
        totalClicks: data.totalClicks || 0,
        lastClickAt: data.lastClickAt?.toDate() || null,
        clickEvents: (data.clickEvents || []).map((event: any) => ({
          ...event,
          timestamp: event.timestamp?.toDate() || new Date(),
        })),
      })
    })
    callback(urls)
  })
}

export async function getAllUrls(): Promise<UnifiedUrlData[]> {
  try {
    const q = query(collection(db, "urls"), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)

    const urls: UnifiedUrlData[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      urls.push({
        shortCode: data.shortCode,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt?.toDate() || new Date(),
        isActive: data.isActive ?? true,
        totalClicks: data.totalClicks || 0,
        lastClickAt: data.lastClickAt?.toDate() || null,
        clickEvents: (data.clickEvents || []).map((event: any) => ({
          ...event,
          timestamp: event.timestamp?.toDate() || new Date(),
        })),
      })
    })

    return urls
  } catch (error) {
    console.error("Error getting all URLs:", error)
    return []
  }
}
