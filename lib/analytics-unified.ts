import { db } from "./firebase"
import { collection, query, where, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore"

export interface ClickEvent {
  timestamp: Date
  userAgent: string
  referer: string
  ip: string
}

export interface UnifiedUrlData {
  shortCode: string
  originalUrl: string
  createdAt: Date
  isActive: boolean
  customerId: string
  userId: string
  totalClicks: number
  lastClickAt: Date | null
  clickEvents: ClickEvent[]
}

export function subscribeToTopUrls(callback: (urls: UnifiedUrlData[]) => void, limitCount = 10) {
  const q = query(
    collection(db, "urls"),
    where("totalClicks", ">", 0),
    orderBy("totalClicks", "desc"),
    limit(limitCount),
  )

  return onSnapshot(q, (snapshot) => {
    const urls: UnifiedUrlData[] = []
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data()
      urls.push({
        shortCode: docSnapshot.id,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt?.toDate() || new Date(),
        isActive: data.isActive,
        customerId: data.customerId,
        userId: data.userId,
        totalClicks: data.totalClicks || 0,
        lastClickAt: data.lastClickAt?.toDate() || null,
        clickEvents: data.clickEvents || [],
      })
    })
    callback(urls)
  })
}

export async function getUrlAnalytics(shortCode: string): Promise<UnifiedUrlData | null> {
  try {
    const urlDoc = await getDoc(doc(db, "urls", shortCode))

    if (!urlDoc.exists()) {
      return null
    }

    const data = urlDoc.data()
    return {
      shortCode,
      originalUrl: data.originalUrl,
      createdAt: data.createdAt?.toDate() || new Date(),
      isActive: data.isActive,
      customerId: data.customerId,
      userId: data.userId,
      totalClicks: data.totalClicks || 0,
      lastClickAt: data.lastClickAt?.toDate() || null,
      clickEvents: data.clickEvents || [],
    }
  } catch (error) {
    console.error("Error fetching URL analytics:", error)
    return null
  }
}

export function subscribeToUrlAnalytics(shortCode: string, callback: (data: UnifiedUrlData | null) => void) {
  return onSnapshot(doc(db, "urls", shortCode), (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data()
      callback({
        shortCode,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt?.toDate() || new Date(),
        isActive: data.isActive,
        customerId: data.customerId,
        userId: data.userId,
        totalClicks: data.totalClicks || 0,
        lastClickAt: data.lastClickAt?.toDate() || null,
        clickEvents: data.clickEvents || [],
      })
    } else {
      callback(null)
    }
  })
}
