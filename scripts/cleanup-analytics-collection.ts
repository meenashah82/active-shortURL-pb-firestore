import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore"

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

async function cleanupAnalyticsCollection() {
  console.log("Starting analytics collection cleanup...")

  try {
    // Get all analytics documents
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`Found ${analyticsSnapshot.size} analytics documents to delete`)

    if (analyticsSnapshot.size === 0) {
      console.log("No analytics documents found. Collection may already be cleaned up.")
      return
    }

    const batch = writeBatch(db)
    let batchCount = 0

    for (const analyticsDoc of analyticsSnapshot.docs) {
      console.log(`Deleting analytics document: ${analyticsDoc.id}`)
      batch.delete(doc(db, "analytics", analyticsDoc.id))
      batchCount++

      // Commit batch every 500 operations (Firestore limit)
      if (batchCount >= 500) {
        await batch.commit()
        console.log(`Deleted batch of ${batchCount} documents`)
        batchCount = 0
      }
    }

    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit()
      console.log(`Deleted final batch of ${batchCount} documents`)
    }

    console.log("Analytics collection cleanup completed successfully!")
  } catch (error) {
    console.error("Error during cleanup:", error)
    throw error
  }
}

// Run the cleanup
cleanupAnalyticsCollection()
  .then(() => {
    console.log("Cleanup script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Cleanup script failed:", error)
    process.exit(1)
  })
