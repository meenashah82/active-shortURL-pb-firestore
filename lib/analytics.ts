import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';

export interface UrlData {
  shortCode: string;
  originalUrl: string;
  createdAt: Timestamp;
  totalClicks: number;
  isActive: boolean;
}

export interface ClickEvent {
  id?: string;
  shortCode: string;
  timestamp: Timestamp;
  userAgent?: string;
  referer?: string;
  ip?: string;
}

export interface UrlAnalytics {
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  createdAt: Timestamp;
  lastClickAt?: Timestamp;
  clickHistory: ClickEvent[];
}

// Create a new short URL
export async function createShortUrl(shortCode: string, originalUrl: string): Promise<void> {
  const urlRef = doc(db, "urls", shortCode);
  
  console.log(`📝 Creating short URL: ${shortCode} -> ${originalUrl}`);
  
  try {
    // Check if short code already exists
    const urlDoc = await getDoc(urlRef);
    if (urlDoc.exists()) {
      throw new Error(`Short code ${shortCode} already exists`);
    }

    // Create the URL document
    const urlData: UrlData = {
      shortCode,
      originalUrl,
      createdAt: Timestamp.now(),
      totalClicks: 0,
      isActive: true
    };

    await setDoc(urlRef, urlData);
    console.log(`✅ Short URL created successfully: ${shortCode}`);
  } catch (error) {
    console.error(`❌ Error creating short URL:`, error);
    throw error;
  }
}

// Get URL data
export async function getUrlData(shortCode: string): Promise<UrlData | null> {
  const urlRef = doc(db, "urls", shortCode);
  
  try {
    const urlDoc = await getDoc(urlRef);
    
    if (!urlDoc.exists()) {
      return null;
    }

    return urlDoc.data() as UrlData;
  } catch (error) {
    console.error(`❌ Error getting URL data for ${shortCode}:`, error);
    return null;
  }
}

// Track a click
export async function trackClick(shortCode: string, metadata: {
  userAgent?: string;
  referer?: string;
  ip?: string;
} = {}): Promise<void> {
  try {
    console.log(`[Analytics] Tracking click for ${shortCode}`);
    
    const urlRef = doc(db, 'urls', shortCode);
    const urlDoc = await getDoc(urlRef);
    
    if (!urlDoc.exists()) {
      console.error(`[Analytics] URL ${shortCode} not found`);
      return;
    }

    // Create click event
    const clickEvent: ClickEvent = {
      shortCode,
      timestamp: Timestamp.now(),
      userAgent: metadata.userAgent,
      referer: metadata.referer,
      ip: metadata.ip
    };

    // Add to clicks collection
    await addDoc(collection(db, 'clicks'), clickEvent);

    // Update URL document
    await updateDoc(urlRef, {
      totalClicks: increment(1),
      lastClickAt: Timestamp.now()
    });

    console.log(`[Analytics] Click tracked successfully for ${shortCode}`);
  } catch (error) {
    console.error('[Analytics] Error tracking click:', error);
  }
}

// Get recent URLs
export async function getRecentUrls(limitCount: number = 10): Promise<UrlData[]> {
  const urlsQuery = query(
    collection(db, "urls"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  
  try {
    const snapshot = await getDocs(urlsQuery);
    const urls: UrlData[] = [];
    
    snapshot.forEach((doc) => {
      urls.push(doc.data() as UrlData);
    });
    
    return urls;
  } catch (error) {
    console.error("❌ Error getting recent URLs:", error);
    return [];
  }
}

// Get analytics for a specific URL
export async function getAnalytics(shortCode: string): Promise<UrlAnalytics | null> {
  try {
    console.log(`[Analytics] Getting analytics for ${shortCode}`);
    
    const urlRef = doc(db, 'urls', shortCode);
    const urlDoc = await getDoc(urlRef);
    
    if (!urlDoc.exists()) {
      console.log(`[Analytics] URL ${shortCode} not found`);
      return null;
    }

    const urlData = urlDoc.data();
    
    // Get click history
    const clicksQuery = query(
      collection(db, 'clicks'),
      where('shortCode', '==', shortCode),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const clicksSnapshot = await getDocs(clicksQuery);
    const clickHistory: ClickEvent[] = clicksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClickEvent));

    const analytics: UrlAnalytics = {
      shortCode,
      originalUrl: urlData.originalUrl,
      totalClicks: urlData.totalClicks || 0,
      createdAt: urlData.createdAt,
      lastClickAt: urlData.lastClickAt,
      clickHistory
    };

    console.log(`[Analytics] Retrieved analytics for ${shortCode}:`, analytics);
    return analytics;
  } catch (error) {
    console.error('[Analytics] Error getting analytics:', error);
    return null;
  }
}

// Get all URLs
export async function getAllUrls(): Promise<UrlAnalytics[]> {
  try {
    console.log('[Analytics] Getting all URLs');
    
    const urlsQuery = query(
      collection(db, 'urls'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const urlsSnapshot = await getDocs(urlsQuery);
    const urls: UrlAnalytics[] = [];
    
    for (const doc of urlsSnapshot.docs) {
      const data = doc.data();
      urls.push({
        shortCode: doc.id,
        originalUrl: data.originalUrl,
        totalClicks: data.totalClicks || 0,
        createdAt: data.createdAt,
        lastClickAt: data.lastClickAt,
        clickHistory: []
      });
    }
    
    console.log(`[Analytics] Retrieved ${urls.length} URLs`);
    return urls;
  } catch (error) {
    console.error('[Analytics] Error getting all URLs:', error);
    return [];
  }
}

// Enhanced real-time listener for analytics data
export function subscribeToAnalytics(shortCode: string, callback: (data: UrlData | null) => void): () => void {
  const urlRef = doc(db, "urls", shortCode);

  console.log(`🔄 Starting real-time analytics subscription for: ${shortCode}`);

  return onSnapshot(
    urlRef,
    {
      includeMetadataChanges: true,
    },
    async (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UrlData;
        console.log("📡 Analytics update received:", {
          shortCode,
          totalClicks: data.totalClicks,
        });
        callback(data);
      } else {
        console.log(`❌ No analytics document found for: ${shortCode}`);
        callback(null);
      }
    },
    (error) => {
      console.error("❌ Real-time analytics subscription error:", error);
      callback(null);
    },
  );
}

// Get recent clicks across all URLs (for dashboard)
export function subscribeToRecentClicks(
  callback: (clicks: Array<ClickEvent & { shortCode: string }>) => void,
  limitCount = 50,
): () => void {
  const urlsQuery = query(
    collection(db, 'urls'),
    where('totalClicks', '>', 0),
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  );

  return onSnapshot(
    urlsQuery,
    {
      includeMetadataChanges: true,
    },
    async (snapshot) => {
      const recentClicks: Array<ClickEvent & { shortCode: string }> = [];

      for (const doc of snapshot.docs) {
        const urlData = doc.data() as UrlData;
        const clicksQuery = query(
          collection(db, 'clicks'),
          where('shortCode', '==', shortCode),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const clicksSnapshot = await getDocs(clicksQuery);
        clicksSnapshot.forEach((clickDoc) => {
          const clickData = clickDoc.data() as ClickEvent;
          recentClicks.push({ ...clickData, shortCode: urlData.shortCode });
        });
      }

      recentClicks.sort((a, b) => {
        const aTime = a.timestamp?.seconds || 0;
        const bTime = b.timestamp?.seconds || 0;
        return bTime - aTime;
      });

      callback(recentClicks.slice(0, limitCount));
    },
    (error) => {
      console.error("Error in recent clicks subscription:", error);
      callback([]);
    },
  );
}

// Get top performing URLs
export function subscribeToTopUrls(
  callback: (urls: Array<{ shortCode: string; clicks: number; originalUrl: string }>) => void,
  limitCount = 10,
): () => void {
  const urlsQuery = query(
    collection(db, 'urls'),
    where('isActive', '==', true),
    orderBy('totalClicks', 'desc'),
    limit(limitCount),
  );

  return onSnapshot(
    urlsQuery,
    {
      includeMetadataChanges: true,
    },
    async (snapshot) => {
      const urls: Array<{ shortCode: string; clicks: number; originalUrl: string }> = [];

      for (const doc of snapshot.docs) {
        const urlData = doc.data() as UrlData;
        urls.push({
          shortCode: urlData.shortCode,
          clicks: urlData.totalClicks,
          originalUrl: urlData.originalUrl,
        });
      }

      callback(urls.slice(0, limitCount));
    },
    (error) => {
      console.error("Error in top URLs subscription:", error);
      callback([]);
    },
  );
}
