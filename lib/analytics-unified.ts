import { db } from "./firebase"
import { collection, query, where, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore"

export interface UnifiedUrlData {
  shortCode: string
  originalUrl: string
  createdAt: any
  isActive: boolean
  expiresAt: any
  lastClickAt?: any
  totalClicks: number
  createdBy?: string
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
    snapshot.forEach((doc) => {
      const data = doc.data()
      urls.push({
        shortCode: doc.id,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt,
        isActive: data.isActive,
        expiresAt: data.expiresAt,
        lastClickAt: data.lastClickAt,
        totalClicks: data.totalClicks,
        createdBy: data.createdBy,
      } as UnifiedUrlData)
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
      createdAt: data.createdAt,
      isActive: data.isActive,
      expiresAt: data.expiresAt,
      lastClickAt: data.lastClickAt,
      totalClicks: data.totalClicks,
      createdBy: data.createdBy,
    } as UnifiedUrlData
  } catch (error) {
    console.error("Error fetching URL analytics:", error)
    return null
  }
}

export function subscribeToUrlAnalytics(shortCode: string, callback: (data: UnifiedUrlData | null) => void) {
  return onSnapshot(doc(db, "urls", shortCode), (doc) => {
    if (doc.exists()) {
      const data = doc.data()
      callback({
        shortCode,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt,
        isActive: data.isActive,
        expiresAt: data.expiresAt,
        lastClickAt: data.lastClickAt,
        totalClicks: data.totalClicks,
        createdBy: data.createdBy,
      } as UnifiedUrlData)
    } else {
      callback(null)
    }
  })
}
