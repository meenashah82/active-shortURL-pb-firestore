import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore"

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
  console.log("🧹 Starting analytics collection cleanup...")

  try {
    // Get all analytics documents
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`📊 Found ${analyticsSnapshot.size} analytics documents to delete`)

    let deleted = 0
    let errors = 0

    for (const analyticsDoc of analyticsSnapshot.docs) {
      try {
        await deleteDoc(doc(db, "analytics", analyticsDoc.id))
        deleted++
        console.log(`🗑️ Deleted analytics document: ${analyticsDoc.id}`)
      } catch (error) {
        console.error(`❌ Error deleting ${analyticsDoc.id}:`, error)
        errors++
      }
    }

    console.log(`🎉 Cleanup complete! Deleted: ${deleted}, Errors: ${errors}`)
  } catch (error) {
    console.error("❌ Cleanup failed:", error)
  }
}

// Run cleanup
cleanupAnalyticsCollection()
