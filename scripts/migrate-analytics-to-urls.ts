import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore"

// Firebase config - replace with your actual config
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
  console.log("🚀 Starting migration of analytics data to URLs collection...")

  try {
    // Get all documents from analytics collection
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`📊 Found ${analyticsSnapshot.size} analytics documents`)

    let migratedCount = 0
    let skippedCount = 0

    for (const analyticsDoc of analyticsSnapshot.docs) {
      const shortCode = analyticsDoc.id
      const analyticsData = analyticsDoc.data()

      console.log(`🔄 Processing ${shortCode}...`)

      // Check if corresponding URL document exists
      const urlDocRef = doc(db, "urls", shortCode)
      const urlDoc = await getDoc(urlDocRef)

      if (!urlDoc.exists()) {
        console.log(`⚠️  URL document for ${shortCode} not found, skipping...`)
        skippedCount++
        continue
      }

      // Update URL document with analytics data
      await updateDoc(urlDocRef, {
        totalClicks: analyticsData.totalClicks || 0,
        lastClickAt: analyticsData.lastClickAt || null,
        clickEvents: analyticsData.clickEvents || [],
      })

      console.log(`✅ Migrated analytics for ${shortCode}`)
      migratedCount++
    }

    console.log(`🎉 Migration completed!`)
    console.log(`✅ Migrated: ${migratedCount} documents`)
    console.log(`⚠️  Skipped: ${skippedCount} documents`)
  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  }
}

// Run the migration
migrateAnalyticsToUrls()
  .then(() => {
    console.log("✅ Migration script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Migration script failed:", error)
    process.exit(1)
  })
