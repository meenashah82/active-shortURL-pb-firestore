import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore"

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
  console.log("Starting analytics migration...")

  try {
    // Get all analytics documents
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`Found ${analyticsSnapshot.size} analytics documents`)

    const batch = writeBatch(db)
    let batchCount = 0

    for (const analyticsDoc of analyticsSnapshot.docs) {
      const shortCode = analyticsDoc.id
      const analyticsData = analyticsDoc.data()

      console.log(`Migrating analytics for ${shortCode}`)

      // Update the corresponding URL document
      const urlRef = doc(db, "urls", shortCode)
      batch.update(urlRef, {
        totalClicks: analyticsData.totalClicks || 0,
        lastClickAt: analyticsData.lastClickAt || null,
        clickEvents: analyticsData.clickEvents || [],
      })

      batchCount++

      // Commit batch every 500 operations (Firestore limit)
      if (batchCount >= 500) {
        await batch.commit()
        console.log(`Committed batch of ${batchCount} updates`)
        batchCount = 0
      }
    }

    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit()
      console.log(`Committed final batch of ${batchCount} updates`)
    }

    console.log("Analytics migration completed successfully!")
  } catch (error) {
    console.error("Error during migration:", error)
    throw error
  }
}

// Run the migration
migrateAnalyticsToUrls()
  .then(() => {
    console.log("Migration script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Migration script failed:", error)
    process.exit(1)
  })
