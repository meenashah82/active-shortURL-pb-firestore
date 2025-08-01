import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore"
import { cleanupAnalyticsCollection } from "../lib/analytics-unified"

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

async function runCleanup() {
  try {
    console.log("🧹 Starting analytics collection cleanup...")
    const deletedCount = await cleanupAnalyticsCollection()
    console.log(`✅ Cleanup completed successfully! Deleted ${deletedCount} documents.`)
    process.exit(0)
  } catch (error) {
    console.error("❌ Cleanup failed:", error)
    process.exit(1)
  }
}

async function cleanupAnalyticsCollection() {
  console.log("Starting cleanup of analytics collection...")
  console.log("⚠ WARNING: This will permanently delete the analytics collection!")

  // Add a 5-second delay to allow user to cancel if needed
  console.log("Starting in 5 seconds... Press Ctrl+C to cancel")
  await new Promise((resolve) => setTimeout(resolve, 5000))

  try {
    // Get all analytics documents
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`Found ${analyticsSnapshot.docs.length} analytics documents to delete`)

    let deletedCount = 0
    let errorCount = 0

    for (const analyticsDoc of analyticsSnapshot.docs) {
      const shortCode = analyticsDoc.id

      try {
        await deleteDoc(doc(db, "analytics", shortCode))
        deletedCount++
        console.log(`✓ Deleted analytics document: ${shortCode}`)
      } catch (error) {
        console.error(`✗ Error deleting ${shortCode}:`, error)
        errorCount++
      }
    }

    console.log("\n=== Cleanup Complete ===")
    console.log(`Successfully deleted: ${deletedCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log(`Total processed: ${analyticsSnapshot.docs.length}`)

    return deletedCount
  } catch (error) {
    console.error("Cleanup failed:", error)
    return 0
  }
}

// Run the cleanup
runCleanup()
