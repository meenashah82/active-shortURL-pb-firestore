import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, deleteDoc } from "firebase/firestore"

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
    console.log("Starting analytics collection cleanup...")

    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`Found ${analyticsSnapshot.size} analytics documents to delete`)

    for (const doc of analyticsSnapshot.docs) {
      await deleteDoc(doc.ref)
      console.log(`Deleted analytics document: ${doc.id}`)
    }

    console.log("Analytics collection cleanup completed!")
  } catch (error) {
    console.error("Cleanup failed:", error)
  }
}

cleanupAnalyticsCollection()
