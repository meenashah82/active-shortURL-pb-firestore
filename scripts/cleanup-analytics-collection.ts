import { db } from "@/lib/firebase"
import { collection, getDocs, doc, writeBatch } from "firebase/firestore"

async function cleanupAnalyticsCollection() {
  console.log("🧹 Starting analytics collection cleanup...")

  try {
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))

    if (analyticsSnapshot.empty) {
      console.log("ℹ️ Analytics collection is already empty")
      return
    }

    console.log(`📊 Found ${analyticsSnapshot.size} documents to delete`)

    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500
    const docs = analyticsSnapshot.docs
    let deletedCount = 0

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db)
      const batchDocs = docs.slice(i, i + batchSize)

      batchDocs.forEach((docSnapshot) => {
        batch.delete(doc(db, "analytics", docSnapshot.id))
      })

      await batch.commit()
      deletedCount += batchDocs.length
      console.log(`🗑️ Deleted ${deletedCount}/${docs.length} documents`)
    }

    console.log("✅ Analytics collection cleanup completed successfully!")
  } catch (error) {
    console.error("❌ Cleanup failed:", error)
    throw error
  }
}

// Run cleanup
cleanupAnalyticsCollection()
  .then(() => {
    console.log("Cleanup script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Cleanup script failed:", error)
    process.exit(1)
  })
