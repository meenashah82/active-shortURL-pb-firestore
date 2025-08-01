import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function migrateAnalyticsToUrls() {
  try {
    console.log("🔄 Starting migration of analytics data to URLs collection...")

    // Get all documents from analytics collection
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`📊 Found ${analyticsSnapshot.size} analytics documents`)

    let migrated = 0
    let skipped = 0

    for (const analyticsDoc of analyticsSnapshot.docs) {
      const shortCode = analyticsDoc.id
      const analyticsData = analyticsDoc.data()

      console.log(`🔄 Processing ${shortCode}...`)

      // Check if URL document exists
      const urlDocRef = doc(db, "urls", shortCode)
      const urlDoc = await getDoc(urlDocRef)

      if (!urlDoc.exists()) {
        console.log(`⚠️  URL document not found for ${shortCode}, skipping...`)
        skipped++
        continue
      }

      // Update URL document with analytics data
      await updateDoc(urlDocRef, {
        totalClicks: analyticsData.totalClicks || 0,
        lastClickAt: analyticsData.lastClickAt || null,
        clickEvents: analyticsData.clickEvents || [],
      })

      console.log(`✅ Migrated analytics for ${shortCode}`)
      migrated++
    }

    console.log(`🎉 Migration complete! Migrated: ${migrated}, Skipped: ${skipped}`)
  } catch (error) {
    console.error("❌ Migration failed:", error)
  }
}

// Run migration
migrateAnalyticsToUrls()
