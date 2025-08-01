import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, type Timestamp } from "firebase/firestore"

export interface UnifiedUrlData {
  id: string
  shortCode: string
  originalUrl: string
  createdAt: Timestamp
  isActive: boolean
  customerId: string
  userId: string
  totalClicks: number
  lastClickAt: Timestamp | null
  clickEvents: ClickEvent[]
}

export interface ClickEvent {
  timestamp: Timestamp
  userAgent: string
  ip: string
  referer: string
}

export interface AnalyticsData {
  shortCode: string
  originalUrl: string
  totalClicks: number
  lastClickAt: Timestamp | null
  clickEvents: ClickEvent[]
  createdAt: Timestamp
}

export async function getUrlAnalytics(shortCode: string, customerId: string): Promise<AnalyticsData | null> {
  try {
    const urlsRef = collection(db, "urls")
    const q = query(urlsRef, where("shortCode", "==", shortCode), where("customerId", "==", customerId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const urlDoc = querySnapshot.docs[0]
    const data = urlDoc.data() as UnifiedUrlData

    return {
      shortCode: data.shortCode,
      originalUrl: data.originalUrl,
      totalClicks: data.totalClicks || 0,
      lastClickAt: data.lastClickAt,
      clickEvents: data.clickEvents || [],
      createdAt: data.createdAt,
    }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return null
  }
}

export async function getUserUrls(customerId: string, limitCount = 10): Promise<UnifiedUrlData[]> {
  try {
    const urlsRef = collection(db, "urls")
    const q = query(
      urlsRef,
      where("customerId", "==", customerId),
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UnifiedUrlData[]
  } catch (error) {
    console.error("Error fetching user URLs:", error)
    return []
  }
}

export function subscribeToUserUrls(
  customerId: string,
  callback: (urls: UnifiedUrlData[]) => void,
  limitCount = 10,
): () => void {
  const urlsRef = collection(db, "urls")
  const q = query(
    urlsRef,
    where("customerId", "==", customerId),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
    limit(limitCount),
  )

  return onSnapshot(q, (querySnapshot) => {
    const urls = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UnifiedUrlData[]
    callback(urls)
  })
}

export function subscribeToTopUrls(callback: (urls: UnifiedUrlData[]) => void, limitCount = 10): () => void {
  const urlsRef = collection(db, "urls")
  const q = query(
    urlsRef,
    where("isActive", "==", true),
    where("totalClicks", ">", 0),
    orderBy("totalClicks", "desc"),
    limit(limitCount),
  )

  return onSnapshot(q, (querySnapshot) => {
    const urls = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UnifiedUrlData[]
    callback(urls)
  })
}

export async function getTopUrls(limitCount = 10): Promise<UnifiedUrlData[]> {
  try {
    const urlsRef = collection(db, "urls")
    const q = query(
      urlsRef,
      where("isActive", "==", true),
      where("totalClicks", ">", 0),
      orderBy("totalClicks", "desc"),
      limit(limitCount),
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UnifiedUrlData[]
  } catch (error) {
    console.error("Error fetching top URLs:", error)
    return []
  }
}
