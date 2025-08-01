import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore"

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

async function migrateAnalyticsToUrls() {
  try {
    console.log("Starting analytics migration...")

    // Get all analytics documents
    const analyticsSnapshot = await getDocs(collection(db, "analytics"))
    console.log(`Found ${analyticsSnapshot.size} analytics documents`)

    for (const analyticsDoc of analyticsSnapshot.docs) {
      const shortCode = analyticsDoc.id
      const analyticsData = analyticsDoc.data()

      console.log(`Migrating analytics for ${shortCode}...`)

      // Update the corresponding URL document
      const urlDocRef = doc(db, "urls", shortCode)

      await updateDoc(urlDocRef, {
        totalClicks: analyticsData.totalClicks || 0,
        lastClickAt: analyticsData.lastClickAt || null,
        clickEvents: analyticsData.clickEvents || [],
      })

      console.log(`✅ Migrated ${shortCode}`)
    }

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
  }
}

migrateAnalyticsToUrls()
