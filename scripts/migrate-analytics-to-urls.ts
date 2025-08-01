import { db } from "../lib/firebase"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"

async function migrateAnalyticsToUrls() {
  try {
    console.log("Starting migration of analytics data to URLs collection...")

    // Get all analytics documents
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`Found ${analyticsSnapshot.size} analytics documents`)

    for (const analyticsDoc of analyticsSnapshot.docs) {
      const analyticsData = analyticsDoc.data()
      const shortCode = analyticsDoc.id

      try {
        // Update the corresponding URL document with analytics data
        await updateDoc(doc(db, "urls", shortCode), {
          totalClicks: analyticsData.totalClicks || 0,
          lastClickAt: analyticsData.lastClickAt || null,
          clickEvents: analyticsData.clickEvents || [],
        })

        console.log(`✅ Migrated analytics for ${shortCode}`)
      } catch (error) {
        console.error(`❌ Failed to migrate ${shortCode}:`, error)
      }
    }

    console.log("Migration completed!")
  } catch (error) {
    console.error("Migration failed:", error)
  }
}

// Run migration
migrateAnalyticsToUrls()
