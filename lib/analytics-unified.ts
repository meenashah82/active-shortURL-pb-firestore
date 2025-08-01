import { db } from "./firebase"
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  increment,
} from "firebase/firestore"

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
  createdBy: string
  totalClicks: number
  lastClickAt: Date | null
  clickEvents: ClickEvent[]
}

export async function createShortUrl(originalUrl: string, userId: string): Promise<UnifiedUrlData> {
  const shortCode = generateShortCode()
  const urlData: UnifiedUrlData = {
    shortCode,
    originalUrl,
    createdAt: new Date(),
    isActive: true,
    createdBy: userId,
    totalClicks: 0,
    lastClickAt: null,
    clickEvents: [],
  }

  await setDoc(doc(db, "urls", shortCode), urlData)
  return urlData
}

export async function getUrlByShortCode(shortCode: string): Promise<UnifiedUrlData | null> {
  const docRef = doc(db, "urls", shortCode)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  return {
    ...data,
    createdAt: data.createdAt.toDate(),
    lastClickAt: data.lastClickAt ? data.lastClickAt.toDate() : null,
    clickEvents: data.clickEvents || [],
  } as UnifiedUrlData
}

export async function trackClick(shortCode: string, clickData: ClickEvent): Promise<void> {
  const docRef = doc(db, "urls", shortCode)

  await updateDoc(docRef, {
    totalClicks: increment(1),
    lastClickAt: clickData.timestamp,
    clickEvents: arrayUnion(clickData),
  })
}

export async function getAnalytics(shortCode: string): Promise<any> {
  const urlData = await getUrlByShortCode(shortCode)

  if (!urlData) {
    return null
  }

  return {
    shortCode: urlData.shortCode,
    originalUrl: urlData.originalUrl,
    totalClicks: urlData.totalClicks,
    lastClickAt: urlData.lastClickAt,
    createdAt: urlData.createdAt,
    clickEvents: urlData.clickEvents,
    isActive: urlData.isActive,
  }
}

export function subscribeToTopUrls(callback: (urls: UnifiedUrlData[]) => void): () => void {
  const q = query(collection(db, "urls"), where("totalClicks", ">", 0), orderBy("totalClicks", "desc"), limit(10))

  return onSnapshot(q, (snapshot) => {
    const urls = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        lastClickAt: data.lastClickAt ? data.lastClickAt.toDate() : null,
        clickEvents: data.clickEvents || [],
      } as UnifiedUrlData
    })
    callback(urls)
  })
}

function generateShortCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
