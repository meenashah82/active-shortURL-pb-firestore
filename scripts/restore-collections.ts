import { db } from "@/lib/firebase"
import { collection, doc, setDoc, getDocs, addDoc, serverTimestamp, Timestamp } from "firebase/firestore"

export async function backupExistingData() {
  console.log("🔄 Creating backup of existing data...")
  
  const backup = {
    timestamp: new Date().toISOString(),
    admins: [] as any[],
    urls: [] as any[],
    analytics: [] as any[]
  }

  try {
    // Backup admins
    const adminsSnapshot = await getDocs(collection(db, "admins"))
    adminsSnapshot.forEach((doc) => {
      backup.admins.push({
        id: doc.id,
        ...doc.data()
      })
    })

    // Backup URLs
    try {
      const urlsSnapshot = await getDocs(collection(db, "urls"))
      urlsSnapshot.forEach((doc) => {
        backup.urls.push({
          id: doc.id,
          ...doc.data()
        })
      })
    } catch (error) {
      console.log("URLs collection not accessible or doesn't exist")
    }

    // Backup analytics (if exists)
    try {
      const analyticsSnapshot = await getDocs(collection(db, "analytics"))
      analyticsSnapshot.forEach((doc) => {
        backup.analytics.push({
          id: doc.id,
          ...doc.data()
        })
      })
    } catch (error) {
      console.log("Analytics collection not accessible or doesn't exist")
    }

    console.log(`✅ Backup created: ${backup.admins.length} admins, ${backup.urls.length} URLs, ${backup.analytics.length} analytics`)
    return backup
  } catch (error) {
    console.error("❌ Error creating backup:", error)
    throw error
  }
}

export async function restoreCollections() {
  console.log("🔄 Starting collection restoration...")
  
  try {
    // Check what exists
    let adminsCount = 0
    let urlsCount = 0
    
    try {
      const adminsSnapshot = await getDocs(collection(db, "admins"))
      adminsCount = adminsSnapshot.size
    } catch (error) {
      console.log("Admins collection check failed")
    }

    try {
      const urlsSnapshot = await getDocs(collection(db, "urls"))
      urlsCount = urlsSnapshot.size
    } catch (error) {
      console.log("URLs collection doesn't exist or is inaccessible")
    }

    // Create sample URLs if none exist
    if (urlsCount === 0) {
      console.log("🔗 Creating sample URLs...")
      
      const sampleUrls = [
        {
          shortCode: "sample1",
          originalUrl: "https://www.google.com",
          createdAt: serverTimestamp(),
          isActive: true,
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          totalClicks: 0
        },
        {
          shortCode: "sample2", 
          originalUrl: "https://www.github.com",
          createdAt: serverTimestamp(),
          isActive: true,
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          totalClicks: 0
        },
        {
          shortCode: "sample3",
          originalUrl: "https://www.stackoverflow.com",
          createdAt: serverTimestamp(),
          isActive: true,
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          totalClicks: 0
        }
      ]

      for (const urlData of sampleUrls) {
        // Create URL document
        await setDoc(doc(db, "urls", urlData.shortCode), urlData)
        
        // Create placeholder in clicks subcollection
        const clicksRef = collection(db, "urls", urlData.shortCode, "clicks")
        await addDoc(clicksRef, {
          _placeholder: true,
          createdAt: serverTimestamp(),
          shortCode: urlData.shortCode,
          note: "This is a placeholder document to initialize the clicks subcollection"
        })
      }
      
      urlsCount = sampleUrls.length
      console.log(`✅ Created ${sampleUrls.length} sample URLs`)
    }

    return {
      success: true,
      message: "Collections restored successfully!",
      details: {
        admins: adminsCount,
        urls: urlsCount,
        analytics: 0
      }
    }
  } catch (error) {
    console.error("❌ Error restoring collections:", error)
    throw error
  }
}
