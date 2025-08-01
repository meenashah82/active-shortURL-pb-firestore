import { db } from "../lib/firebase"
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"

async function cleanupAnalyticsCollection() {
  try {
    console.log("Starting cleanup of analytics collection...")

    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`Found ${analyticsSnapshot.size} analytics documents to delete`)

    for (const analyticsDoc of analyticsSnapshot.docs) {
      await deleteDoc(doc(db, "analytics", analyticsDoc.id))
      console.log(`✅ Deleted analytics document: ${analyticsDoc.id}`)
    }

    console.log("Cleanup completed!")
  } catch (error) {
    console.error("Cleanup failed:", error)
  }
}

// Run cleanup
cleanupAnalyticsCollection()
