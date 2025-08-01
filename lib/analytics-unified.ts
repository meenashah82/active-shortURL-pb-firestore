import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  Timestamp,
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
  lastClickAt: Timestamp | null
  clickEvents: ClickEvent[]
  customerId?: string
  userId?: string
}

export async function getUnifiedUrlData(shortCode: string): Promise<UnifiedUrlData | null> {
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
      isActive: data.isActive ?? true,
      totalClicks: data.totalClicks ?? 0,
      lastClickAt: data.lastClickAt ?? null,
      clickEvents: data.clickEvents ?? [],
      customerId: data.customerId,
      userId: data.userId,
    }
  } catch (error) {
    console.error("Error getting unified URL data:", error)
    return null
  }
}

export async function trackClick(shortCode: string, clickData: Partial<ClickEvent> = {}): Promise<void> {
  try {
    const urlRef = doc(db, "urls", shortCode)
    const clickEvent: ClickEvent = {
      timestamp: Timestamp.now(),
      ...clickData,
    }

    await updateDoc(urlRef, {
      totalClicks: increment(1),
      lastClickAt: clickEvent.timestamp,
      clickEvents: arrayUnion(clickEvent),
    })
  } catch (error) {
    console.error("Error tracking click:", error)
    throw error
  }
}

export async function createUnifiedUrl(data: {
  shortCode: string
  originalUrl: string
  customerId?: string
  userId?: string
}): Promise<void> {
  try {
    const urlData: UnifiedUrlData = {
      shortCode: data.shortCode,
      originalUrl: data.originalUrl,
      createdAt: Timestamp.now(),
      isActive: true,
      totalClicks: 0,
      lastClickAt: null,
      clickEvents: [],
      customerId: data.customerId,
      userId: data.userId,
    }

    await setDoc(doc(db, "urls", data.shortCode), urlData)
  } catch (error) {
    console.error("Error creating unified URL:", error)
    throw error
  }
}

export function subscribeToTopUrls(callback: (urls: UnifiedUrlData[]) => void): () => void {
  const q = query(collection(db, "urls"), where("totalClicks", ">", 0), orderBy("totalClicks", "desc"), limit(10))

  return onSnapshot(q, (snapshot) => {
    const urls: UnifiedUrlData[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      urls.push({
        shortCode: doc.id,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt,
        isActive: data.isActive ?? true,
        totalClicks: data.totalClicks ?? 0,
        lastClickAt: data.lastClickAt ?? null,
        clickEvents: data.clickEvents ?? [],
        customerId: data.customerId,
        userId: data.userId,
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
        shortCode: doc.id,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt,
        isActive: data.isActive ?? true,
        totalClicks: data.totalClicks ?? 0,
        lastClickAt: data.lastClickAt ?? null,
        clickEvents: data.clickEvents ?? [],
        customerId: data.customerId,
        userId: data.userId,
      })
    })

    return urls
  } catch (error) {
    console.error("Error getting all URLs:", error)
    return []
  }
}
