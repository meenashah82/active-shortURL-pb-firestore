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
  try {
    console.log("🧹 Starting cleanup of analytics collection...")

    // Get all documents from analytics collection
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`📊 Found ${analyticsSnapshot.size} analytics documents to delete`)

    let deleted = 0

    for (const analyticsDoc of analyticsSnapshot.docs) {
      const shortCode = analyticsDoc.id
      console.log(`🗑️  Deleting analytics document: ${shortCode}`)

      await deleteDoc(doc(db, "analytics", shortCode))
      deleted++
    }

    console.log(`🎉 Cleanup complete! Deleted ${deleted} analytics documents`)
  } catch (error) {
    console.error("❌ Cleanup failed:", error)
  }
}

// Run cleanup
cleanupAnalyticsCollection()
