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
  console.log("Starting migration of analytics data to URLs collection...")

  try {
    // Get all analytics documents
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`Found ${analyticsSnapshot.docs.length} analytics documents`)

    let migratedCount = 0
    let errorCount = 0

    for (const analyticsDoc of analyticsSnapshot.docs) {
      const shortCode = analyticsDoc.id
      const analyticsData = analyticsDoc.data()

      try {
        // Check if URL document exists
        const urlDocRef = doc(db, "urls", shortCode)
        const urlDoc = await getDoc(urlDocRef)

        if (urlDoc.exists()) {
          // Update URL document with analytics data
          await updateDoc(urlDocRef, {
            totalClicks: analyticsData.totalClicks || 0,
            lastClickAt: analyticsData.lastClickAt || null,
            clickEvents: analyticsData.clickEvents || [],
          })

          migratedCount++
          console.log(`✓ Migrated analytics for ${shortCode}`)
        } else {
          console.log(`⚠ URL document not found for ${shortCode}`)
          errorCount++
        }
      } catch (error) {
        console.error(`✗ Error migrating ${shortCode}:`, error)
        errorCount++
      }
    }

    console.log("\n=== Migration Complete ===")
    console.log(`Successfully migrated: ${migratedCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log(`Total processed: ${analyticsSnapshot.docs.length}`)
  } catch (error) {
    console.error("Migration failed:", error)
  }
}

// Run the migration
migrateAnalyticsToUrls()
