import { db } from "@/lib/firebase"
import { collection, getDocs, doc, writeBatch } from "firebase/firestore"

async function migrateAnalyticsToUrls() {
  console.log("🚀 Starting analytics migration...")

  try {
    // Get all analytics documents
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    const urlsSnapshot = await getDocs(collection(db, "urls"))

    // Create maps for efficient lookup
    const analyticsMap = new Map()
    analyticsSnapshot.forEach((doc) => {
      const data = doc.data()
      analyticsMap.set(data.shortCode, data)
    })

    const urlsMap = new Map()
    urlsSnapshot.forEach((doc) => {
      const data = doc.data()
      urlsMap.set(data.shortCode, { id: doc.id, ...data })
    })

    console.log(`📊 Found ${analyticsMap.size} analytics documents and ${urlsMap.size} URL documents`)

    // Batch update URLs with analytics data
    const batch = writeBatch(db)
    let updateCount = 0

    for (const [shortCode, analyticsData] of analyticsMap) {
      const urlData = urlsMap.get(shortCode)
      if (urlData) {
        const urlRef = doc(db, "urls", urlData.id)
        batch.update(urlRef, {
          totalClicks: analyticsData.totalClicks || 0,
          lastClickAt: analyticsData.lastClickAt || null,
          clickEvents: analyticsData.clickEvents || [],
        })
        updateCount++
      }
    }

    if (updateCount > 0) {
      await batch.commit()
      console.log(`✅ Successfully migrated ${updateCount} URLs with analytics data`)
    } else {
      console.log("ℹ️ No URLs found to migrate")
    }

    console.log("🎉 Migration completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  }
}

// Run migration
migrateAnalyticsToUrls()
  .then(() => {
    console.log("Migration script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Migration script failed:", error)
    process.exit(1)
  })
