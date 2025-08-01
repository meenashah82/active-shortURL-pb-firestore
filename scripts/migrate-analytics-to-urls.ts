import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore"

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
    console.log("Starting migration of analytics data to URLs collection...")

    // Get all analytics documents
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`Found ${analyticsSnapshot.size} analytics documents`)

    let migratedCount = 0
    let errorCount = 0

    for (const analyticsDoc of analyticsSnapshot.docs) {
      try {
        const shortCode = analyticsDoc.id
        const analyticsData = analyticsDoc.data()

        // Update the corresponding URL document
        const urlRef = doc(db, "urls", shortCode)

        await updateDoc(urlRef, {
          totalClicks: analyticsData.totalClicks || 0,
          lastClickAt: analyticsData.lastClickAt || null,
          clickEvents: analyticsData.clickEvents || [],
        })

        migratedCount++
        console.log(`✓ Migrated analytics for ${shortCode}`)
      } catch (error) {
        errorCount++
        console.error(`✗ Error migrating ${analyticsDoc.id}:`, error)
      }
    }

    console.log(`\nMigration completed:`)
    console.log(`- Successfully migrated: ${migratedCount}`)
    console.log(`- Errors: ${errorCount}`)
  } catch (error) {
    console.error("Migration failed:", error)
  }
}

migrateAnalyticsToUrls()
