import { db } from "./firebase"
import { collection, query, where, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore"

export interface UnifiedUrlData {
  shortCode: string
  originalUrl: string
  createdAt: any
  isActive: boolean
  createdBy?: string
  totalClicks: number
  lastClickAt: any
  clickEvents: Array<{
    timestamp: any
    userAgent: string
    referer: string
    ip: string
  }>
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
      urls.push({ ...doc.data(), shortCode: doc.id } as UnifiedUrlData)
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

    return { ...urlDoc.data(), shortCode } as UnifiedUrlData
  } catch (error) {
    console.error("Error fetching URL analytics:", error)
    return null
  }
}

export function subscribeToUrlAnalytics(shortCode: string, callback: (data: UnifiedUrlData | null) => void) {
  return onSnapshot(doc(db, "urls", shortCode), (doc) => {
    if (doc.exists()) {
      callback({ ...doc.data(), shortCode } as UnifiedUrlData)
    } else {
      callback(null)
    }
  })
}
