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
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

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
  createdBy?: {
    customerId?: string
    userId?: string
  }
  // Embedded analytics data
  totalClicks: number
  lastClickAt?: Timestamp
  clickEvents: ClickEvent[]
}

export async function createShortUrl(
  shortCode: string,
  originalUrl: string,
  metadata?: {
    createdBy?: {
      customerId?: string
      userId?: string
    }
  },
): Promise<void> {
  const urlData: UnifiedUrlData = {
    shortCode,
    originalUrl,
    createdAt: serverTimestamp() as Timestamp,
    isActive: true,
    createdBy: metadata?.createdBy,
    // Initialize analytics data
    totalClicks: 0,
    clickEvents: [],
  }

  await setDoc(doc(db, "urls", shortCode), urlData)
}

export async function getUrlData(shortCode: string): Promise<UnifiedUrlData | null> {
  const docRef = doc(db, "urls", shortCode)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return docSnap.data() as UnifiedUrlData
  }

  return null
}

export async function trackClick(
  shortCode: string,
  clickData: {
    userAgent?: string
    referer?: string
    ip?: string
  },
): Promise<void> {
  const urlRef = doc(db, "urls", shortCode)

  const clickEvent: ClickEvent = {
    timestamp: serverTimestamp() as Timestamp,
    userAgent: clickData.userAgent,
    referer: clickData.referer,
    ip: clickData.ip,
  }

  await updateDoc(urlRef, {
    totalClicks: increment(1),
    lastClickAt: serverTimestamp(),
    clickEvents: arrayUnion(clickEvent),
  })
}

export function subscribeToUrlAnalytics(
  shortCode: string,
  callback: (data: UnifiedUrlData | null) => void,
): () => void {
  const docRef = doc(db, "urls", shortCode)

  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UnifiedUrlData)
    } else {
      callback(null)
    }
  })
}

export function subscribeToTopUrls(limitCount: number, callback: (urls: UnifiedUrlData[]) => void): () => void {
  const q = query(
    collection(db, "urls"),
    where("totalClicks", ">", 0),
    orderBy("totalClicks", "desc"),
    limit(limitCount),
  )

  return onSnapshot(q, (snapshot) => {
    const urls: UnifiedUrlData[] = []
    snapshot.forEach((doc) => {
      urls.push(doc.data() as UnifiedUrlData)
    })
    callback(urls)
  })
}

export async function getAllUrls(): Promise<UnifiedUrlData[]> {
  const q = query(collection(db, "urls"), orderBy("createdAt", "desc"))

  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const urls: UnifiedUrlData[] = []
        snapshot.forEach((doc) => {
          urls.push(doc.data() as UnifiedUrlData)
        })
        unsubscribe()
        resolve(urls)
      },
      reject,
    )
  })
}
