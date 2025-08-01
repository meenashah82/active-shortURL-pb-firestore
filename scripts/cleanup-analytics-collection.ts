import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore"

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

async function cleanupAnalyticsCollection() {
  console.log("🧹 Starting cleanup of analytics collection...")

  try {
    // Get all documents from analytics collection
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`📊 Found ${analyticsSnapshot.size} analytics documents to delete`)

    let deletedCount = 0

    for (const analyticsDoc of analyticsSnapshot.docs) {
      const shortCode = analyticsDoc.id
      console.log(`🗑️  Deleting analytics document: ${shortCode}`)

      await deleteDoc(doc(db, "analytics", shortCode))
      deletedCount++
    }

    console.log(`🎉 Cleanup completed!`)
    console.log(`🗑️  Deleted: ${deletedCount} documents`)
  } catch (error) {
    console.error("❌ Cleanup failed:", error)
    process.exit(1)
  }
}

// Run the cleanup
cleanupAnalyticsCollection()
  .then(() => {
    console.log("✅ Cleanup script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Cleanup script failed:", error)
    process.exit(1)
  })
